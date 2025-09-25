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

const redisClient = new Redis(process.env.REDIS_URL);

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

app.get('/getallreports',async(req,res)=>{
  try{
    const sessionData = await getSession(req.session.user.sessionToken);
    let ddetails = await doctor_details.findOne({ email: sessionData.username });
    if(!ddetails){
      return res.json({message:"Doctor details not found",status:404});
    }let reports=[];
    let patients=new Set();
    ddetails.appointments.map(async(d)=>{
      if(d.status==="Completed"){
        let pdetails = await patient_details.findOne({ email: d.patientEmail });
        if(pdetails){
          reports.push({patientEmail:d.patientEmail,reports:pdetails.reports});
          let ptnt=await userSchema.findOne({email:d.patientEmail});
          if(ptnt){
            patients.add(ptnt);
          }
        }
      }
    })
    return res.json({patient:patients,reports:reports,message:"Reports found",status:200});
  }catch(err){
    console.log(err);
    return res.json({ message: "Server error" ,status:500});
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
    // console.log("Received request:", req.body);
    const {pmail}=req.body;
    try {
      const pdetails=await patient_details.findOne({email:pmail});
      if(pdetails){
        const response = await axios.post("http://localhost:8001/routes/tab_predict",pdetails.clinical_data);
        console.log("Response from FastAPI:", response.data);
        try{
          const arr=[];
          pdetails.ultrasound_data.map(async(img_url)=>{
            const unetpred=await axios.post("http://localhost:8001/routes/unet_predict",{url:img_url});
            if(arr.length!=0){
              arr = arr.map((num, i) => (num + unetpred[i]) / 2);
            }else{
              arr=unetpred;
            }
          })
          response.map((i)=>{i=i*0.6});
          arr.map((i)=>{i=i*0.4});
          const results=arr.map((num, i) => (num + response[i]));
          const maxIndex = results.indexOf(Math.max(...results));
          res.json({prediction:stage[maxIndex]});

        }catch(err){
          console.log(err);
          res.status(500).json({ error: "ML prediction failed" });

        }
      }
    } catch (error) {
      console.error("Error calling FastAPI:", error.message);
      res.status(500).json({ error: "ML prediction failed" });
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
  
  

app.listen(5500,()=>{
    console.log("on port 5500")
})