// File: dodesk/src/Component/Footer.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
} from "@mui/material";
import FacebookIcon  from "@mui/icons-material/Facebook";
import TwitterIcon   from "@mui/icons-material/Twitter";
import LinkedInIcon  from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import "./Footer.css";

const Footer = () => {
  return (
    <Box component="footer" className="footer">
      <Container maxWidth="lg">
        <Grid container spacing={4} className="footer-grid">

          {/* ── Column 1: Brand ── */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" className="footer-brand-heading">
              DoDesk
            </Typography>
            <Typography variant="body2" className="footer-text">
              Your command center for project success. Revolutionize the way you
              manage your projects with our intuitive, all-in-one platform.
            </Typography>

            <Box className="social-links">
              <IconButton
                aria-label="Facebook"
                color="inherit"
                component={Link}
                href="https://facebook.com/dodesk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                aria-label="Twitter"
                color="inherit"
                component={Link}
                href="https://twitter.com/dodesk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                aria-label="LinkedIn"
                color="inherit"
                component={Link}
                href="https://linkedin.com/company/dodesk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                aria-label="Instagram"
                color="inherit"
                component={Link}
                href="https://instagram.com/dodesk"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* ── Column 2: Quick Links ── */}
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom className="footer-heading">
              Quick Links
            </Typography>
            <ul className="footer-links-list">
              <li>
                <Link href="#about"       color="inherit" className="footer-link">About Us</Link>
              </li>
              <li>
                <Link href="#features"    color="inherit" className="footer-link">Features</Link>
              </li>
              <li>
                <Link href="#testimonials" color="inherit" className="footer-link">Testimonials</Link>
              </li>
              <li>
                <Link href="#pricing"     color="inherit" className="footer-link">Pricing</Link>
              </li>
              <li>
                <Link href="#blog"        color="inherit" className="footer-link">Blog</Link>
              </li>
            </ul>
          </Grid>

          {/* ── Column 3: Support ── */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom className="footer-heading">
              Support
            </Typography>
            <ul className="footer-links-list">
              <li>
                <Link href="#contact" color="inherit" className="footer-link">Contact Us</Link>
              </li>
              <li>
                <Link href="#faq"     color="inherit" className="footer-link">FAQs</Link>
              </li>
              <li>
                <Link href="#help"    color="inherit" className="footer-link">Help Center</Link>
              </li>
              <li>
                <Link href="#privacy" color="inherit" className="footer-link">Privacy Policy</Link>
              </li>
              <li>
                <Link href="#terms"   color="inherit" className="footer-link">Terms of Service</Link>
              </li>
            </ul>
          </Grid>

          {/* ── Column 4: Contact ── */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom className="footer-heading">
              Contact Us
            </Typography>

            <div className="footer-contact-item">
              <span className="footer-contact-icon">📍</span>
              <Typography variant="body2" className="footer-contact-text">
                Ahmedabad, Gujarat, India 380015
              </Typography>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-icon">📧</span>
              <Link
                href="mailto:info@dodesk.com"
                color="inherit"
                className="footer-link footer-contact-text"
              >
                info@dodesk.com
              </Link>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-icon">📞</span>
              <Link
                href="tel:+911234567890"
                color="inherit"
                className="footer-link footer-contact-text"
              >
                +91 12345 67890
              </Link>
            </div>
          </Grid>
        </Grid>

        {/* ── Copyright Bar ── */}
        <Box className="copyright">
          <Typography
            variant="body2"
            align="center"
            className="copyright-text"
          >
            &copy; {new Date().getFullYear()}{" "}
            <strong>DoDesk</strong>. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;




















































// //File: dodesk/src/Component/Footer.js

// import React from "react";
// import {
//   Box,
//   Container,
//   Typography,
//   Grid,
//   Link,
//   IconButton,
// } from "@mui/material";
// import FacebookIcon from "@mui/icons-material/Facebook";
// import TwitterIcon from "@mui/icons-material/Twitter";
// import LinkedInIcon from "@mui/icons-material/LinkedIn";
// import InstagramIcon from "@mui/icons-material/Instagram";

// import "./Footer.css"; 

// const Footer = () => {
//   return (
//     <Box component="footer" className="footer">
//       <Container maxWidth="lg">
//         <Grid container spacing={4} className="footer-grid">
//           {/* Column 1: Company Info */}
//           <Grid item xs={12} md={4}>
//             <Typography variant="h6" gutterBottom className="footer-heading">
//               DoDesk
//             </Typography>
//             <Typography variant="body2" className="footer-text">
//               Your command center for project success. Revolutionize the way you
//               manage your projects with our intuitive, all-in-one platform.
//             </Typography>
//             <Box className="social-links">
//               <IconButton
//                 aria-label="Facebook"
//                 color="inherit"
//                 component={Link}
//                 href="https://facebook.com/dodesk"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <FacebookIcon />
//               </IconButton>
//               <IconButton
//                 aria-label="Twitter"
//                 color="inherit"
//                 component={Link}
//                 href="https://twitter.com/dodesk"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <TwitterIcon />
//               </IconButton>
//               <IconButton
//                 aria-label="LinkedIn"
//                 color="inherit"
//                 component={Link}
//                 href="https://linkedin.com/company/dodesk"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <LinkedInIcon />
//               </IconButton>
//               <IconButton
//                 aria-label="Instagram"
//                 color="inherit"
//                 component={Link}
//                 href="https://instagram.com/dodesk"
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 <InstagramIcon />
//               </IconButton>
//             </Box>
//           </Grid>

//           {/* Column 2: Quick Links */}
//           <Grid item xs={12} md={2}>
//             <Typography variant="h6" gutterBottom className="footer-heading">
//               Quick Links
//             </Typography>
//             <ul className="footer-links-list">
//               <li>
//                 <Link href="#about" color="inherit" className="footer-link">
//                   About Us
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#features" color="inherit" className="footer-link">
//                   Features
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="#testimonials"
//                   color="inherit"
//                   className="footer-link"
//                 >
//                   Testimonials
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#pricing" color="inherit" className="footer-link">
//                   📊 Pricing
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#blog" color="inherit" className="footer-link">
//                   📝 Blog
//                 </Link>
//               </li>
//             </ul>
//           </Grid>

//           {/* Column 3: Support */}
//           <Grid item xs={12} md={3}>
//             <Typography variant="h6" gutterBottom className="footer-heading">
//               Support
//             </Typography>
//             <ul className="footer-links-list">
//               <li>
//                 <Link href="#contact" color="inherit" className="footer-link">
//                   💬 Contact Us
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#faq" color="inherit" className="footer-link">
//                   ❓ FAQs
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#help" color="inherit" className="footer-link">
//                   🆘 Help Center
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#privacy" color="inherit" className="footer-link">
//                   🔒 Privacy Policy
//                 </Link>
//               </li>
//               <li>
//                 <Link href="#terms" color="inherit" className="footer-link">
//                   📋 Terms of Service
//                 </Link>
//               </li>
//             </ul>
//           </Grid>

//           {/* Column 4: Contact Info */}
//           <Grid item xs={12} md={3}>
//             <Typography variant="h6" gutterBottom className="footer-heading">
//               Contact Us
//             </Typography>
//             <Typography variant="body2" className="footer-text">
//               📍 Ahmedabad, Gujarat, India 380015
//               <br />
//               <br />
//               <Link
//                 href="mailto:info@dodesk.com"
//                 color="inherit"
//                 className="footer-link"
//               >
//                 📧 info@dodesk.com
//               </Link>
//               <br />
//               <br />
//               <Link
//                 href="tel:+911234567890"
//                 color="inherit"
//                 className="footer-link"
//               >
//                 📞 +91 12345 67890
//               </Link>
//             </Typography>
//           </Grid>
//         </Grid>

//         {/* Copyright Section */}
//         <Box className="copyright">
//           <Typography variant="body2" align="center" className="copyright-text">
//             &copy; {new Date().getFullYear()} DoDesk. All rights reserved.
//           </Typography>
//         </Box>
//       </Container>
//     </Box>
//   );
// };

// export default Footer;