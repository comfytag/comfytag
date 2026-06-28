// Run once to generate VAPID keys: node scripts/generate-vapid-keys.js
// Copy the output into your .env files.
import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('\n✅ VAPID keys generated — add these to your .env files:\n')
console.log(`# apps/api/.env`)
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_EMAIL=admin@comfytag.com`)
console.log(`\n# apps/web/.env.local`)
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret — never commit it.\n')
