import { Router } from 'express'
import { verifyAdminRole } from '../utils/verifyAdminRole.js'
import {
    getActiveMarqueeItems,
    createMarqueeItem,
    updateMarqueeItem,
    deleteMarqueeItem,
} from '../controllers/marquee.js'
import {
    getActiveSteps,
    createStep,
    updateStep,
    deleteStep,
} from '../controllers/howItWorks.js'
import {
    getActiveBanners,
    createBanner,
    updateBanner,
    deleteBanner,
} from '../controllers/promoBanner.js'
import { getActiveFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faq.js'
import {
    getLegalDocument,
    upsertLegalDocument,
    getPageContent,
    upsertPageContent,
} from '../controllers/legal.js'

const router = Router()

// ─── Marquee Strip ────────────────────────────────────────────────────────────
router.get('/marquee',             getActiveMarqueeItems)
router.post('/marquee',            verifyAdminRole(['moderator']), createMarqueeItem)
router.put('/marquee/:id',         verifyAdminRole(['moderator']), updateMarqueeItem)
router.delete('/marquee/:id',      verifyAdminRole(['moderator']), deleteMarqueeItem)

// ─── How It Works Steps ───────────────────────────────────────────────────────
router.get('/how-it-works',        getActiveSteps)
router.post('/how-it-works',       verifyAdminRole(['moderator']), createStep)
router.put('/how-it-works/:id',    verifyAdminRole(['moderator']), updateStep)
router.delete('/how-it-works/:id', verifyAdminRole(['moderator']), deleteStep)

// ─── Promo Banners ────────────────────────────────────────────────────────────
router.get('/banners',             getActiveBanners)
router.post('/banners',            verifyAdminRole(['moderator']), createBanner)
router.put('/banners/:id',         verifyAdminRole(['moderator']), updateBanner)
router.delete('/banners/:id',      verifyAdminRole(['moderator']), deleteBanner)

// ─── FAQ ──────────────────────────────────────────────────────────────────────
router.get('/faqs',            getActiveFaqs)
router.post('/faqs',           verifyAdminRole(['moderator']), createFaq)
router.put('/faqs/:id',        verifyAdminRole(['moderator']), updateFaq)
router.delete('/faqs/:id',     verifyAdminRole(['moderator']), deleteFaq)

// ─── Legal Documents (terms / privacy) ───────────────────────────────────────
router.get('/legal/:docType',  getLegalDocument)
router.put('/legal/:docType',  verifyAdminRole(['moderator']), upsertLegalDocument)

// ─── Static Page Content (about) ─────────────────────────────────────────────
router.get('/pages/:key',      getPageContent)
router.put('/pages/:key',      verifyAdminRole(['moderator']), upsertPageContent)

export default router
