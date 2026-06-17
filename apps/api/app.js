import 'dotenv/config'
import express from 'express'
import mongoose from "mongoose"
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http'
import { initializeSocket, setGlobalIoInstance } from './socket/index.js'
import { validateEnvironment } from './startup.js'
import config from './config.js'
const app = express();
import dns from 'dns'
import { testRedisConnection } from './jobs/emailQueue.js'

// Validate environment at startup (fail fast if missing env vars)
await validateEnvironment()

// Test Redis connectivity on every startup — queue crashes in dev are caught early too
try {
  await testRedisConnection()
} catch (err) {
  console.error(`\n❌ Startup failed: ${err.message}\n`)
  process.exit(1)
}

const connect = async () => {
  await mongoose.connect(config.mongodb.uri)
  console.log(`✅ Connected to MongoDB`)
}
const PORT = config.port;


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
import cmsRouter from './routes/cms.js'
import paystackVerifyRouter from './routes/paystackVerify.js'
import testimonialRouter from './routes/testimonial.js'
import uploadRouter from './routes/upload.js'
import analyticsRouter from './routes/analytics.js'
import promosRouter from './routes/promos.js'
import teamRouter from './routes/team.js'
import partnerRouter from './routes/partner.js'
import { verifyPartner } from './utils/verifyToken.js'
import adminRouter from './routes/admin.js'
import webhooksRouter from './routes/webhooks.js'
import cron from 'node-cron'
import { updateExpiredTickets } from './jobs/updateExpiredTickets.js'







// ─── AWS SNS webhook — must be registered BEFORE global bodyParser so that
//     SNS's text/plain body is parsed as a raw string rather than ignored.
app.use('/api/webhooks', express.text({ type: ['text/plain', 'application/json', '*/*'] }));
app.use('/api/webhooks', webhooksRouter);

// Middlewares
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())
const allowedOrigins = config.cors.origins

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

// Granular RBAC admin execution endpoints (Phase 1 expansion)
app.use("/api/admin", adminRouter)


app.use("/auth", authRouter)      // Authentication endpoint
app.use("/event", eventRouter)   // event endpoint
app.use('/events', eventSearchRouter)  // search must be before /:id wildcard
app.use('/events', teamRouter)   // team routes before /:id wildcard in eventRouter
app.use("/events", eventRouter)  // event alias (plural)
app.use("/categories", categoryRouter)   // category alias
app.use("/category", categoryRouter)   // category endpoint
app.use("/audience", audienceRouter)   // audience endpoint
app.use("/users", usersRouter)   // Users endpoint
app.use("/bank", verifyPartner, bankRouter)     // bank accounts — partners only
app.use("/withdraw", verifyPartner, withdrawRouter)   // withdrawal requests — partners only

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
app.use('/cms', cmsRouter)
app.use('/paystack', paystackVerifyRouter)
app.use('/testimonials', testimonialRouter)
app.use('/upload', uploadRouter)

// Analytics & promos — partner features
app.use('/', analyticsRouter)
app.use('/', promosRouter)








//Partner Routes
app.use("/partner/auth", authRouter)                              // pre-auth — no guard
app.use("/partner/users", usersRouter)                            // profile/public — no guard
app.use("/partner/event", teamRouter)                             // team routes before /:id wildcard
app.use("/partner/event", verifyPartner, eventRouter)             // event management
app.use("/partner/category", categoryRouter)                      // category lookups — public ok
app.use("/partner/audience", verifyPartner, audienceRouter)       // attendee data
app.use("/partner/bank", verifyPartner, bankRouter)               // bank accounts
app.use("/partner/withdraw", verifyPartner, withdrawRouter)       // withdrawal requests
app.use("/partner/wallet", verifyPartner, walletRouter)           // wallet balance
app.use("/partner", verifyPartner, partnerRouter)                 // partner-specific endpoints (KYC, etc.)

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

// Email validation endpoint - disabled due to connection pooling issues
// Re-enable and fix if needed in future
/*app.post('/check-email', async (req, res, next) => {
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

})*/




// ******** Email Validation with MX-record and Ping ****** //




connect()
  .then(() => {
    // Create HTTP server wrapper for Express app
    const httpServer = http.createServer(app)

    // Initialize Socket.io for real-time notifications
    const io = initializeSocket(httpServer)

    // Attach io instance to app for use in controllers
    app.locals.io = io

    // Store io instance globally for use in job processors
    setGlobalIoInstance(io)

    // Schedule ticket status update job — runs every hour at minute 0
    cron.schedule('0 * * * *', updateExpiredTickets)
    console.log('[Jobs] Ticket status update job scheduled to run every hour')

    // Run once on startup to catch any missed updates from downtime
    updateExpiredTickets().catch(console.error)

    // Start listening on configured port
    httpServer.listen(process.env.PORT || PORT, () => {
      console.log(`Listening to port ${process.env.PORT || PORT}`)
      console.log('✓ Socket.io server running alongside Express')
      console.log('✓ Global io instance available for job processors')
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