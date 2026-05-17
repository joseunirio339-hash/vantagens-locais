/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Home from './pages/Home';
import MyVouchers from './pages/MyVouchers';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerStore from './pages/PartnerStore';
import Partners from './pages/Partners';
import Products from './pages/Products';
import Subscription from './pages/Subscription';
import PartnerSignup from './pages/PartnerSignup';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import LojistaManager from './pages/LojistaManager';
import PurchaseHistory from './pages/PurchaseHistory';
import ReferralPage from './pages/ReferralPage';
import ReferralLanding from './pages/ReferralLanding';
import Leaderboard from './pages/Leaderboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "MyVouchers": MyVouchers,
    "PartnerDashboard": PartnerDashboard,
    "PartnerStore": PartnerStore,
    "Partners": Partners,
    "Products": Products,
    "Subscription": Subscription,
    "PartnerSignup": PartnerSignup,
    "AdminDashboard": AdminDashboard,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfUse": TermsOfUse,
    "LojistaManager": LojistaManager,
    "PurchaseHistory": PurchaseHistory,
    "ReferralPage": ReferralPage,
    "ReferralLanding": ReferralLanding,
    "Leaderboard": Leaderboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};