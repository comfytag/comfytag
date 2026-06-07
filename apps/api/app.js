import 'dotenv/config'
import express from 'express'
import mongoose from "mongoose"
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http'
import { initializeSocket } from './socket/index.js'
const app = express();
import dns from 'dns'
// const telnet = require('telnet-client');
// import net from 'net'

const whitelist = ['http://localhost:3000', 'http://example2.com'];

// ✅ Enable pre-flight requests
// app.options('*', cors());

// const corsOptions = {
//   credentials: true,
//   origin: (origin, callback) => {
//     if (whitelist.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
// };



const connect = async () => {
  await mongoose.connect(process.env.MONGO)
  console.log("Connected to MongoDB")
}
const PORT = 4002;


import authRouter from "./routes/auth.js"
import eventRouter from "./routes/event.js"
import usersRouter from "./routes/users.js"
import categoryRouter from "./routes/category.js"
import audienceRouter from "./routes/audience.js"
import bankRouter from "./routes/bank.js"
import withdrawRouter from './routes/withdraw.js'
import faceRouter from './routes/face.js'
import transferRouter from './routes/transfer.js'
import notificationRouter from './routes/notification.js'
import pushTokenRouter from './routes/pushToken.js'
import likeRouter from './routes/like.js'
import commentRouter from './routes/comment.js'
import commentActionsRouter from './routes/commentActions.js'
import followRouter from './routes/follow.js'
import eventSearchRouter from './routes/eventSearch.js'
import searchRouter from './routes/search.js'
import alertRouter from './routes/alert.js'
import referralRouter from './routes/referral.js'
import walletRouter from './routes/wallet.js'
import ticketTokenRouter from './routes/ticketToken.js'
import configRouter from './routes/config.js'
import paystackVerifyRouter from './routes/paystackVerify.js'
import testimonialRouter from './routes/testimonial.js'
import uploadRouter from './routes/upload.js'
import analyticsRouter from './routes/analytics.js'
import promosRouter from './routes/promos.js'







// Middlewares
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.WEB_URL,
  process.env.PARTNER_URL,
  process.env.ADMIN_URL,
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman during development)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// Enable preflight requests for all routes
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))


//Admin Routes
app.use("/admin/auth", authRouter)     // Authentication endpoint
app.use("/admin/users", usersRouter)   // Users endpoint
app.use("/admin/event", eventRouter)   // event endpoint
app.use("/admin/category", categoryRouter)   // category endpoint
app.use("/admin/audience", audienceRouter)   // audience endpoint
app.use("/admin/withdraw", withdrawRouter)   //  withdraw info endpoint
app.use("/admin/bank", bankRouter)   // bank info endpoint


app.use("/auth", authRouter)      // Authentication endpoint
app.use("/event", eventRouter)   // event endpoint
app.use('/events', eventSearchRouter)  // search must be before /:id wildcard
app.use("/events", eventRouter)  // event alias (plural)
app.use("/categories", categoryRouter)   // category alias
app.use("/category", categoryRouter)   // category endpoint
app.use("/audience", audienceRouter)   // audience endpoint
app.use("/users", usersRouter)   // Users endpoint
app.use("/bank", bankRouter)     // bank accounts
app.use("/withdraw", withdrawRouter)   // withdrawal requests

// Face recognition
app.use('/face', faceRouter)

// Ticket transfers
app.use('/tickets/transfer', transferRouter)

// Health check — for Docker & monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Notifications
app.use('/notifications', notificationRouter)
app.use('/notification', notificationRouter)

// Push tokens
app.use('/push-tokens', pushTokenRouter)

// General search
app.use('/search', searchRouter)

// Social layer — likes, comments, follows
app.use('/events', likeRouter)
app.use('/events', commentRouter)
app.use('/comments', commentActionsRouter)
app.use('/organizers', followRouter)

// Commerce & discovery infrastructure
app.use('/alerts', alertRouter)
app.use('/referral', referralRouter)
app.use('/wallet', walletRouter)
app.use('/tickets', ticketTokenRouter)
app.use('/config', configRouter)
app.use('/paystack', paystackVerifyRouter)
app.use('/testimonials', testimonialRouter)
app.use('/upload', uploadRouter)

// Analytics & promos — partner features
app.use('/', analyticsRouter)
app.use('/', promosRouter)








//Partner Routes
app.use("/partner/auth", authRouter)     // Authentication endpoint
app.use("/partner/users", usersRouter)   // Users endpoint
app.use("/partner/event", eventRouter)   // event endpoint
app.use("/partner/category", categoryRouter)   // category endpoint
app.use("/partner/audience", audienceRouter)   // audience endpoint
app.use("/partner/bank", bankRouter)   // bank info endpoint
app.use("/partner/withdraw", withdrawRouter)   //  withdraw info endpoint
app.use("/partner/wallet", walletRouter)   // wallet endpoint

// Error handling
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('ERROR HANDLER:', req.method, req.url, err.status, err.message)
  }
  const errorStatus = err.status || err.http_code || 500
  const errorMessage = err.message || "Something went wrong"
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})


// ******** Email Validation with MX-record and Ping ****** //

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

function validateEmail(emails) {
  var emailCheck =[]
  emails.map( email =>{
    const val = emailRegex.test(email)
    emailCheck.push({val, email})
    console.log(emailCheck)
  })
  return emailCheck
}
 
function validateEmail2(emails) {
  const val = emailRegex.test(emails)
  console.log({val, emails})
  return val
}

function pickDomain(email) {
  const domain = email.split("@")
  return domain[1]
}
function findMxRecord(domain) {
  console.log(domain)
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, address) => {
      if (err) {
        console.log( 'Domain not found')
        return resolve({ err, message: 'Domain not found' })
      }
      const min = address.reduce((a, b) => {
        if (a.priority < b.priority) {
          return a
        }
        return b
      }, {})
      return resolve(min)
    })
  })
}

function findDomainIp(domain) {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, (err, address, family) => {
      const domainIp = { address, family }
      return resolve(domainIp)
    });
  })
}

app.post('/check-email', async (req, res, next) => {
  try {
    const { email } = req.body;
    const results = [];

    email.map( async(email)=>{
    const emailValidateStatus = await validateEmail2(email)

      if (!emailValidateStatus) {  // Email format not correct
        const message = "Email format not correct"
        const checked = { message, email }
        results.push(checked)
      } else { // Email format correct

      const domain = await pickDomain(email)

      const address = await findMxRecord(domain)

      const ip = await findDomainIp(domain)

      const message = address?.message ? address.message : "email verified"

      const checked = {email: email, message, 'Ip address': ip, 'mx-record': address, format: 'Valid', 'domain-name': domain }
      results.push(checked)
    }
  })
  res.send(results);
  } catch (error) {
    res.send('Server errors', error)
  }

})




// ******** Email Validation with MX-record and Ping ****** //




connect()
  .then(() => {
    // Create HTTP server wrapper for Express app
    const httpServer = http.createServer(app)

    // Initialize Socket.io for real-time notifications
    const io = initializeSocket(httpServer)

    // Attach io instance to app for use in controllers
    app.locals.io = io

    // Start listening on configured port
    httpServer.listen(process.env.PORT || PORT, () => {
      console.log(`Listening to port ${process.env.PORT || PORT}`)
      console.log('✓ Socket.io server running alongside Express')
    })
  })
  .catch((err) => {
    console.error("MongoDB connection failed — server not started:", err.message)
    process.exit(1)
  })





// connect to server



// app.listen(process.env.PORT || PORT,
// {
// useNewUrlParser: true,
// useUnifiedTopology: true
// },  console.log("mongo db connected")
// );



// app.get('/', (req,res)=> {
//     res.send("Welcome to Simple Tickets")
// });
//       app.get('/:id', function(req, res) {
//         res.send('Hello ' + req.params.id + '!');
//       });