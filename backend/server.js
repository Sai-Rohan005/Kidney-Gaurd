require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const userSchema = require('./mongo/user');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');
const multer =require("multer");
const cloudinary = require("cloudinary").v2;
const patient_details=require("./mongo/patient_details");
const doctor_details=require("./mongo/doctor_details");
const FormData = require('form-data');

const createAuth = require('./auth');
//start redis - brew services start redis
//start db - mongod --dbpath ~/mongodb-data

// const redisClient = new Redis(process.env.REDIS_URL);
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const { login, getSession, logout } = createAuth(redisClient);

const doctor = { "sairohan005@gmail.com": "Doctor", };
const doctorinfo={"sairohan005@gmail.com":{"specialization":"Nephrologist",qualification:"MBBS, MD",clinic_address:"123, Main Street, City",clinic_timings:"10 AM - 4 PM",experienceYears:4,rating:4} ,}
const stage={0:"No Disease",1:"Stage_1",2:"Stage_2",3:"Stage_3",4:"Stage_4"};


const upload = multer({ storage: multer.memoryStorage() }); // store files in memory

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});


app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set true if HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());


function calculateAge(dob) {
  const birthDate = new Date(dob); // e.g. '2000-05-15'
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // If birthday hasn't occurred yet this year, subtract one
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}



app.post('/register', async (req, res) => {
  try {
    const { name, email,dob, phone, password } = req.body;
    const role = doctor[email] || "Patient";
    // const exuser=userSchema.findOne({email:email});
    // if(exuser){
    //   return res.json({ message: "User already exists" ,status:400});
    // }
    const newUser = new userSchema({ name, role, email,dob, phone, password });
    await newUser.save();
    if(role=='Doctor'){
      const newdoctor=new doctor_details({email});
      let docdata=doctorinfo[email];
      newdoctor.specialization=docdata.specialization;
      newdoctor.qualifications=docdata.qualification;
      newdoctor.clinic_address=docdata.clinic_address;
      newdoctor.clinic_timings=docdata.clinic_timings;
      newdoctor.experienceYears=docdata.experienceYears;
      newdoctor.rating=docdata.rating;
      await newdoctor.save();
    }
    res.status(200).json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.json({ message: 'User not found' ,status:404});
    }

    // Replace with bcrypt.compare if you hashed passwords
    if (user.password !== password) {
      return res.json({ message: 'Incorrect password',status:401 });
    }

    const sessionToken = await login(email, password);

    req.session.user = {
      email,
      role: user.role,
      id: user._id,
      sessionToken,
    };

    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.json({ message: 'Login failed',status:500 });
      }
      return res.json({ message: 'Login successful', role: user.role });
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.json({ message: 'Internal server error',status:500 });
  }
});



app.get("/alldoctor",async(req,resp)=>{
  try{
    let data = await doctor_details.find({});

    if (data && data.length > 0) {
      const today = new Date();
      // Loop over doctors and attach availability
      const updatedDoctors = data.map((doctor) => {
        const bookedDates = doctor.appointments?.map((appt) =>
          new Date(appt.date).toDateString()
        ) || [];

        // Generate next 7 days
        const availability = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);

          // Only add if not booked
          if (!bookedDates.includes(date.toDateString())) {
            availability.push(date);
          }
        }

        return {
          ...doctor.toObject(), // convert mongoose doc to plain object
          availability,
        };
      });

      resp.json({ docdata: updatedDoctors, message: "Doctors available" });
    } else {
      resp.json({ message: "No doctors available" });
    }

  }
  catch(err){
    console.log(err)
  }
})

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Wrap Cloudinary upload_stream into a Promise
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "patient_documents" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };

    // Upload file buffer to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    console.log("Cloudinary Upload:", uploadResult);

    // Find patient using session
    const sessionData = await getSession(req.session.user.sessionToken);
    let pdetails = await patient_details.findOne({ email: sessionData.username });

    if (!pdetails) {
      // Create new patient if not exists
      const newPatient = new patient_details({
        email: sessionData.username,
        ultrasound_data: uploadResult.secure_url,
        public_id: [uploadResult.public_id]
      });
      await newPatient.save();
      return res.json({ message: "Patient details created, please upload again" });
    }

    // Update latest ultrasound image + public_id
    pdetails.ultrasound_data .push(uploadResult.secure_url);
    pdetails.public_id.push(uploadResult.public_id);

    await pdetails.save();

    res.json({
      message: "Upload successful",
      ultrasound_data: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});



app.post('/clinical_data', async (req, res) => {
  const d = req.body;

  try {
    const sessionData = await getSession(req.session.user.sessionToken);

    let pdetails = await patient_details.findOne({ email: sessionData.username });

    if (pdetails) {
      // Merge new data with existing clinical_data
      pdetails.clinical_data = { ...pdetails.clinical_data, ...d };

      console.log("Updating clinical data:", pdetails.clinical_data);

      await pdetails.save();
      res.json({ message: "Clinical data saved" });
    } else {
      const newPatient = new patient_details({
        email: sessionData.username,
        clinical_data: d
      });

      await newPatient.save();
      res.json({ message: "Patient details created, please upload again" });
    }
  } catch (err) {
    console.error("Error saving clinical data:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/getuploads',async(req,res)=>{
  try{
    const sessionData = await getSession(req.session.user.sessionToken);
    let pdetails = await patient_details.findOne({ email: sessionData.username });
    if(pdetails){
      if(pdetails.ultrasound_data.length==0){
        return res.json({message:"No uploads found"})
      }
      res.json({alluploads:pdetails.ultrasound_data,message:"Details found",status:200})
    }else{
      res.json({message:"No details found"})
    }
  }
  catch(err){
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
})


app.post('/clinicalfile',async(req,res)=>{
  const f=req.file;
  
})


app.post('/bookappointment',async(req,res)=>{
  try{
    const {doctor,date,time,problem}=req.body;
    // console.log(doctor,date,time);
    const sessionData = await getSession(req.session.user.sessionToken);
    let pdetails = await patient_details.findOne({ email: sessionData.username });
    let ddetails=await doctor_details.findOne({email:doctor});
    // if(!pdetails){
    //   return res.json({message:"Patient details not found",status:404});
    // }
    if(!ddetails){
      return res.json({message:"Doctor details not found",status:404});
    }
    ddetails.appointments.map((d)=>{
      if(d.date===date && d.time===time){
        return res.json({message:"Doctor not available at this time, please choose another time",status:400});
      }
    })
    
    const appointment={patientEmail:sessionData.username,date:new Date(date).toISOString().split("T")[0],time:time,status:"Scheduled",problem:problem};
    ddetails.appointments.push(appointment);

    if(!pdetails){
      const appointment={doctor_email:doctor,date:new Date(date).toISOString().split("T")[0],time:time,status:"Scheduled"};
      
      const newPatient = new patient_details({
        email: sessionData.username,
        doctor_email: doctor,
      });
      newPatient.appointment_dates.push(appointment);
      await newPatient.save();
    }
    else{
      const appointment={doctor_email:doctor,date:new Date(date).toISOString().split("T")[0],time:time,status:"Scheduled",problem:problem};
      pdetails.doctor_email=doctor;
      pdetails.appointment_dates.push(appointment);
      await pdetails.save();
    }

    await ddetails.save();
    return res.json({message:"Appointment booked successfully",status:200});
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
})

app.get('/getappointments',async(req,res)=>{
  try{
    const sessionData = await getSession(req.session.user.sessionToken);
    let pdetails = await patient_details.findOne({ email: sessionData.username });
    if(!pdetails){
      return res.json({message:"Patient details not found",status:404});
    }
    if(pdetails.appointment_dates.length===0){
      return res.json({message:"No appointments found",status:404});
    }
    return res.json({appointments:pdetails.appointment_dates,message:"Appointments found",status:200});
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
})

app.get('/getdoctorappointments',async(req,res)=>{
  const sessionData = await getSession(req.session.user.sessionToken);
  try{
    let ddetails = await doctor_details.findOne({ email: sessionData.username });
    if(!ddetails){
      return res.json({message:"Doctor details not found",status:404});
    }
    if(ddetails.appointments.length===0){
      return res.json({message:"No appointments found",status:404});
    }
    return res.json({appointments:ddetails.appointments,message:"Appointments found",status:200});
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
})

app.post('/updatedoctorappointmentstatus',async(req,res)=>{
  const sessionData = await getSession(req.session.user.sessionToken);
  try{
    const {patientEmail,date,time,status}=req.body;
    let ddetails = await doctor_details.findOne({ email: sessionData.username });
    if(!ddetails){
      return res.json({message:"Doctor details not found",status:404});
    }
    let pdetails = await patient_details.findOne({ email: patientEmail });
    if(!pdetails){
      return res.json({message:"Patient details not found",status:404});
    }
    let appointmentfound=false;
    ddetails.appointments.map((d)=>{
      if(d.patientEmail===patientEmail){
        d.status=status;
        appointmentfound=true;
      }
    })
    if(!appointmentfound){
      return res.json({message:"Appointment not found",status:404});
    }
    ddetails.markModified("appointments");
    await ddetails.save();

    pdetails.appointment_dates.map((d)=>{
      if(d.doctor_email===sessionData.username){
        d.status=status;
      }
    })
    pdetails.markModified("appointment_dates");
    await pdetails.save();

    return res.json({message:"Appointment status updated successfully",status:200});
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
})

app.get('/getallreports', async (req, res) => {
  try {
    const sessionData = await getSession(req.session.user.sessionToken);
    const ddetails = await doctor_details.findOne({ email: sessionData.username });

    if (!ddetails)
      return res.json({ message: "Doctor details not found", status: 404 });

    // console.log("All appointments:", ddetails.appointments.length);

    // Map over all appointments, not just completed
    const results = await Promise.all(ddetails.appointments.map(async (appointment) => {
      // console.log("Checking patient:", appointment.patientEmail);

      const pdetails = await patient_details.findOne({ email: appointment.patientEmail.toLowerCase() });
      if (!pdetails) {
        // console.log("No patient details found for:", appointment.patientEmail);
        return null;
      }

      const hasReports = Array.isArray(pdetails.reports) && pdetails.reports.length > 0;
      const isCompleted = appointment.status && appointment.status.toLowerCase() === "completed";

      // Only include if completed OR has reports
      if (!isCompleted && !hasReports) {
        // console.log(`Skipping ${appointment.patientEmail} — no reports & not completed`);
        return null;
      }

      let lastReport = null;
      if (hasReports) {
        lastReport = pdetails.reports.at(-1); // latest report
        // console.log(`Found ${pdetails.reports.length} reports for ${appointment.patientEmail}`);
      }

      const ptnt = await userSchema.findOne({ email: appointment.patientEmail.toLowerCase() });
      if (!ptnt) {
        // console.log("No userSchema found for:", appointment.patientEmail);
        return null;
      }

      return {
        patient: ptnt,
        report: lastReport
          ? { ...lastReport, patientEmail: appointment.patientEmail }
          : { message: "No report available", patientEmail: appointment.patientEmail },
      };
    }));

    const filteredResults = results.filter(Boolean);
    const patients = filteredResults.map(r => r.patient);
    const reports = filteredResults.map(r => r.report);

    // console.log("Final patients:", patients.length, "Final reports:", reports.length);

    return res.json({
      patient: patients,
      reports: reports,
      message: "Reports found",
      status: 200,
    });

  } catch (err) {
    console.error(err);
    return res.json({ message: "Server error", status: 500 });
  }
});




app.get('/getpatientreport',async (req,res)=>{
  try {
    const sessionData = await getSession(req.session.user.sessionToken);
    const pdetails = await patient_details.findOne({ email: sessionData.username });
    if(pdetails.reports){
      return res.json({reports: pdetails.reports.at(-1), message: "Reports found", status: 200 });
    }
    return res.json({message:"No reports yet"})
  } catch (err) {
    console.error(err);
    return res.json({ message: "Server error", status: 500 });
  }
})
app.get('/getpatientallreport',async (req,res)=>{
  try {
    const sessionData = await getSession(req.session.user.sessionToken);
    const pdetails = await patient_details.findOne({ email: sessionData.username });
    if(pdetails.reports){
      return res.json({reports: pdetails.reports, message: "Reports found", status: 200 });
    }
    return res.json({message:"No reports yet"})
  } catch (err) {
    console.error(err);
    return res.json({ message: "Server error", status: 500 });
  }
})
app.get('/getpdetails',async (req,res)=>{
  try {
    const sessionData = await getSession(req.session.user.sessionToken);
    const pdetails = await patient_details.findOne({ email: sessionData.username });
    if(pdetails){
      return res.json({pdetails: pdetails, message: "pdetails found", status: 200 });
    }
    return res.json({message:"No pdetails yet"})
  } catch (err) {
    console.error(err);
    return res.json({ message: "Server error", status: 500 });
  }
})


app.post('/getpatientmaindocument',async(req,res)=>{
  // console.log(req.body);
  try{
    // const sessionData = await getSession(req.session.user.sessionToken);
    let pdetails = await patient_details.findOne({ email: req.body.patientEmail });
    if(!pdetails){
      return res.json({message:"Patient details not found",status:404});
    }
    if(pdetails.ultrasound_data.length===0){
      return res.json({message:"No uploads found",status:404});
    }
    return res.json({main:pdetails,message:"Main document found",status:200});
  }catch(err){
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
})

app.post('/completeappointment', async (req, res) => {
  const { patientEmail, date } = req.body;
  const sessionData = await getSession(req.session.user.sessionToken);
  try {
    const pdetails = await patient_details.findOne({ email: patientEmail });

    if (!pdetails) {
      return res.json({ message: "Patient not found", status: 404 });
    }
    const ddetails=await doctor_details.findOne({email:sessionData.username});
    if (!ddetails) {
      return res.json({ message: "doctor not found", status: 404 });
    }


    // Track if we updated anything
    let updated = false;

    // Normalize the date input for reliable comparison
    const reqDate = new Date(date).toISOString().split('T')[0]; // keep only YYYY-MM-DD
    ddetails.appointments.forEach((app)=>{
      const storedDate = new Date(app.date).toISOString().split('T')[0];
      if (storedDate === reqDate) {
        app.status = "completed";
        updated = true;
      }
    })
    // Update the matching appointment
    pdetails.appointment_dates.forEach((appointment) => {
      const storedDate = new Date(appointment.date).toISOString().split('T')[0];
      if (storedDate === reqDate) {
        appointment.status = "completed";
        updated = true;
      }
    });

    if (!updated) {
      return res.json({ message: "No appointment found for given date", status: 404 });
    }

    // Tell Mongoose this nested array was modified
    pdetails.markModified('appointment_dates');
    ddetails.markModified('appointments')

    await pdetails.save();
    await ddetails.save();

    return res.json({ message: "Appointment marked as completed", status: 200 });
  } catch (err) {
    console.error("Error completing appointment:", err);
    return res.json({ message: "Server error", status: 500 });
  }
});










app.post('/logout', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(400).json({ message: 'No active session' });
    }

    await logout(req.session.user.sessionToken);

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logout successful' });
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/getRole', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.sessionToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sessionData = await getSession(req.session.user.sessionToken);
    if (!sessionData) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const user = await userSchema.findOne({ email: sessionData.username });
    if (!user) {
      return res.json({ message: 'User not found' ,status:404});
    }

    return res.json({ role: user.role });
  } catch (err) {
    console.error('GetRole error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/getuser', async (req, res) => {
  // console.log("----- /getuser called -----");
  // console.log("Session ID:", req.sessionID);
  // console.log("Session object:", req.session);

  try {
    if (!req.session.user || !req.session.user.sessionToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sessionData = await getSession(req.session.user.sessionToken);
    if (!sessionData) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const user = await userSchema.findOne({ email: sessionData.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('GetUser error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/changePassword', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.sessionToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const sessionData = await getSession(req.session.user.sessionToken);
    if (!sessionData) {
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await userSchema.findOne({ email: sessionData.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
);


app.post("/predictckd", async (req, res) => {
  // console.log("called predict");
  // console.log(req.body)
  const pdetails  = req.body;
  const sessionData = await getSession(req.session.user.sessionToken);
  try {
    // console.log(pdetails)
    // ---- Tabular data prediction ----
    const tabResponse = await fetch("http://localhost:8001/routes/tab_predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ root: pdetails.pmail.clinical_data })
      // add timeout handling in production
    });
    const tabData = await tabResponse.json();
    console.log(tabData)
    if (tabData.error) throw new Error(tabData.error);
    const tabArr = tabData.probabilities; // e.g. [0.2, 0.8]

    // ---- UNet predictions for multiple images (limit concurrency) ----
    const limit = 4; // adjust concurrency
    const urls = pdetails.pmail.ultrasound_data || [];
    const unetPromises = urls.map(url =>
      fetch("http://localhost:8001/routes/unet_predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).then(r => r.json())
    );

    const unetResponses = await Promise.all(unetPromises);
    // validate
    console.log(unetResponses)
    unetResponses.forEach(r => {
      if (!Array.isArray(r.probabilities)) throw new Error("invalid unet response");
    });

    // average element-wise
    const n = unetResponses.length || 1;
    const probsLen = unetResponses[0].probabilities.length;
    let unetAvg = new Array(probsLen).fill(0);
    for (const r of unetResponses) {
      r.probabilities.forEach((p, i) => { unetAvg[i] += p; });
    }
    unetAvg = unetAvg.map(v => v / n);

    // ---- Combine tabular and UNet probabilities (weighted sum) ----
    const wUnet = 0.6, wTab = 0.4;
    if (tabArr.length !== unetAvg.length) {
      throw new Error("mismatched probability vector lengths");
    }
    const results = unetAvg.map((p, i) => (wUnet * p) + (wTab * tabArr[i]));
    console.log(results)
    // map index -> label
    const stage = ["notckd", "ckd"]; // ensure matches training labels
    const maxIndex = results.indexOf(Math.max(...results));

    const getalldetails=await userSchema.findOne({'email':pdetails.pmail.email});
    const arrangereport={};
    arrangereport["name"]=getalldetails.name
    arrangereport["age"]=calculateAge(getalldetails.dob)
    arrangereport["id"]=getalldetails._id
    arrangereport["email"]=pdetails.pmail.email
    arrangereport["dob"]=getalldetails.dob
    arrangereport["predict"]=stage[maxIndex]
    arrangereport["Serum creatinine (mg/dl)"]=pdetails.pmail.clinical_data["Serum creatinine (mg/dl)"]
    arrangereport["Blood urea (mg/dl)"]=pdetails.pmail.clinical_data["Blood urea (mg/dl)"]
    arrangereport["Hemoglobin level (gms)"]=pdetails.pmail.clinical_data["Hemoglobin level (gms)"]
    arrangereport["Blood pressure (mm/Hg)"]=pdetails.pmail.clinical_data["Blood pressure (mm/Hg)"]
    arrangereport["Albumin in urine"]=pdetails.pmail.clinical_data["Albumin in urine"]
    arrangereport["doctor"]=sessionData.username
    arrangereport['date']=new Date()

    const updatereports=await patient_details.findOne({"email":pdetails.pmail.email});
    updatereports.reports.push(arrangereport);
    await updatereports.save();

    res.json({ prediction: stage[maxIndex], probabilities: results[maxIndex] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "ML prediction failed" });
  }
});




  app.post("/tabFile", upload.array("files"), async (req, res) => {
    try {
      const results = [];
  
      for (const file of req.files) {
        const formData = new FormData();
        // Correct way to append a Buffer
        formData.append("file", file.buffer, { filename: file.originalname });
  
        const response = await axios.post(
          "http://localhost:8001/routes/extract_text",
          formData,
          {
            headers: formData.getHeaders(), // form-data headers
          }
        );
  
        results.push({ filename: file.originalname, ocr_result: response.data });
      }
  
      res.json({ success: true, results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to extract text" });
    }
  });
  
  

  module.exports=app;
// app.listen(5500,()=>{
//     console.log("on port 5500")
// })