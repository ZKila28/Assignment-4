Project Title
Lae Urban Youths Bike Workshop 

Overview
The final version of the three-page site built in Assessments 2–3: same topic, same audience, same semantic HTML5 skeleton — now with a hand-written design system, full responsiveness, and meaningful vanilla JavaScript.

Purpose & audience
A volunteer-run community bike workshop needs a site where local riders, parents and budget commuters can find services and prices, check hours, and book a stand or course online. Every feature below maps to one of those tasks.

Pages
index.html — Home: intro, what we do, first-visit steps, gallery, get involved
services.html — Services & courses: prices, filterable course table, recycling, membership
contact.html — Bookings & contact: validated booking form, hours, location
JavaScript features (all vanilla ES6, separate files, no frameworks)
Accessible mobile navigation (js/main.js) — hamburger toggle driven by aria-expanded; Escape closes; state resets across the breakpoint. Without JS the nav is simply always visible.
Theme switcher (js/main.js) — light/dark via data-theme + CSS custom properties; persisted in local Storage; falls back to OS preference; storage errors handled; theme-color meta kept in sync.
Course table live filter (js/main.js, services page) — type-to-filter rows with a role="status" count announcer; hidden entirely without JS.
Form validation & feedback (js/form.js, contact page) — submit +blur + input validation, inline errors linked with aria-describedby,aria-invalid states, focusable error summary (role="alert"), custombusiness rules (no past dates, open days only), character counter withthreshold-only announcements, success panel with a "make another booking"reset. HTML validation attributes remain as the no-JS fallback.
Gallery lightbox (js/gallery.js, home page) — native <dialog>(focus trap + Escape built in), arrow-key navigation, backdrop click toclose, focus returned to the trigger, image-error handling. Thumbnailsare real links, so without JS they open the image directly.
Design system & CSS
Single css/style.css, sectioned: tokens → reset → typography → layout →components → utilities → media queries → focus/motion → dark theme. Flexbox (header/nav rows, sticky footer, option rows, lightbox bar) and CSS Grid (card grids, media split, contact split, footer columns) are documented with in-place decision comments. All layout uses flexible units; type is fluid via clamp(); breakpoints at 40em / 56em / 72em.

File structure
index.html
services.html
contact.html
css/style.css
js/main.js (nav toggle, theme switcher, course filter, footer year)
js/form.js (booking form validation — contact page only)
js/gallery.js (lightbox — home page only)
images/ (workshop-benches[-480|-1400].jpg, course-participant.jpg,
donated-bikes.jpg, workshop-entrance.jpg)
README.md

AI Use Declaration
This project was developed with substantial assistance from chat.z.ai, a generative AI conversational assistant.
AI was used to draft the HTML, CSS and JavaScript code, the page content, and supporting documentation (README, summary, testing plan).
My own contribution consisted of selecting and adding the photographic assets, validating and debugging the code with the W3C validators,
performing all browser, responsive and accessibility testing, and studying the generated code until I could explain every design
and accessibility decision.
