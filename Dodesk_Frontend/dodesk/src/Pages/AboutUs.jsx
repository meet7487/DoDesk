// File: dodesk/src/Pages/AboutUs.jsx
import React, { useEffect, useRef } from "react";
import {
  Box, Container, Typography, Grid,
  Paper, Avatar, useTheme, useMediaQuery,
} from "@mui/material";
import {
  AccessTime, GroupWork, AssignmentTurnedIn, IntegrationInstructions,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "./AboutUs.css";

// ── Feature data ────────────────────────────────────────────
const featuresData = [
  {
    title: "Task Management",
    description: "Easily create, assign, and manage tasks with smart workflows.",
    icon: <AssignmentTurnedIn fontSize="large" />,
  },
  {
    title: "Team Collaboration",
    description: "Communicate, collaborate, and share feedback in real-time.",
    icon: <GroupWork fontSize="large" />,
  },
  {
    title: "Time Tracking",
    description: "Track work hours, productivity, and project deadlines.",
    icon: <AccessTime fontSize="large" />,
  },
  {
    title: "Integrations",
    description: "Seamless integration with popular tools like Slack, GitHub, and Google Drive.",
    icon: <IntegrationInstructions fontSize="large" />,
  },
];

// ── Framer Motion variants (all preserved) ───────────────────────────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden:  { y: 30, opacity: 0 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

const heroVariants = {
  hidden:  { opacity: 0, y: -50 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

// ── Component ─────────────────────────────────────────────
const AboutUs = () => {
  const theme         = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const containerRef  = useRef(null);

  // ── Grok-style starfield ──
  useEffect(() => {
    document.title = "About Us — DoDesk";

    const createStarfield = () => {
      const container = document.querySelector(".about-starfield-layer");
      if (!container) return;
      container.innerHTML = "";

      for (let i = 0; i < 280; i++) {
        const star = document.createElement("div");
        const size = Math.random();
        star.className =
          size < 0.30 ? "star star-small"  :
          size < 0.62 ? "star star-medium" :
          size < 0.86 ? "star star-large"  : "star star-bright";
        star.style.left              = Math.random() * 100 + "%";
        star.style.top               = Math.random() * 100 + "%";
        star.style.animationDelay    = (Math.random() * 6) + "s";
        star.style.animationDuration = (Math.random() * 3 + 2) + "s";
        star.style.setProperty("--brightness", Math.random());
        container.appendChild(star);
      }
      for (let i = 0; i < 5; i++) {
        const s = document.createElement("div");
        s.className = "shooting-star";
        s.style.top               = Math.random() * 65 + "%";
        s.style.left              = "-300px";
        s.style.animationDelay    = (Math.random() * 18 + 2) + "s";
        s.style.animationDuration = (Math.random() * 2.5 + 1.5) + "s";
        container.appendChild(s);
      }
    };

    createStarfield();

    // Scroll animations (preserved)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".animate-fade-in, .animate-slide-left, .animate-slide-right")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Floating particles (logic preserved)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left              = Math.random() * 100 + "%";
      particle.style.animationDuration = Math.random() * 3 + 2 + "s";
      particle.style.animationDelay    = Math.random() * 2 + "s";

      const particlesContainer = container.querySelector(".floating-particles");
      if (particlesContainer) {
        particlesContainer.appendChild(particle);
        setTimeout(() => {
          if (particle.parentNode) particle.parentNode.removeChild(particle);
        }, 5000);
      }
    };

    const particleInterval = setInterval(createParticle, 2000);
    return () => clearInterval(particleInterval);
  }, []);

  return (
    <>
      {/* Grok-style starfield background */}
      <div className="about-starfield-bg">
        <div className="about-starfield-layer" />
      </div>

      <div className="about-container" ref={containerRef}>

        {/* Floating Particles */}
        <div className="floating-particles">
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>

        <Container maxWidth="lg">

          {/* ── Hero ── */}
          <motion.div
            className="about-hero animate-fade-in"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            <Typography
              variant={isSmallScreen ? "h4" : "h3"}
              className="about-title"
              gutterBottom
              align="center"
            >
              <span className="animated-text gradient-text">About DoDesk</span>
            </Typography>
            <Typography
              variant={isSmallScreen ? "body1" : "h6"}
              className="about-subtitle animated-fade"
              align="center"
              sx={{ maxWidth: 800, mx: "auto" }}
            >
              DoDesk is your all-in-one project management solution built for teams
              that want to move fast and collaborate smarter.
            </Typography>
          </motion.div>

          {/* ── Features Grid ── */}
          <motion.div
            className="feature-grid animate-slide-left"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {featuresData.map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants} className="feature-grid-item">
                <Paper elevation={0} className="feature-card animated-card">
                  <Box className="feature-icon">
                    <div className="icon-glow" />
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Vision ── */}
          <motion.div
            className="about-vision animate-fade-in"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Typography
              variant="h4"
              gutterBottom
              align="center"
              className="shimmer-text"
            >
              Our Vision
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{ maxWidth: 800, mx: "auto" }}
              className="animated-fade"
            >
              At DoDesk, our mission is to empower individuals and teams to do their
              best work through simplicity, clarity, and connected workflows. We
              believe productivity is not about doing more — it&apos;s about doing
              what matters most.
            </Typography>
          </motion.div>

          {/* ── Creator ── */}
          <motion.div
            className="about-creator animate-slide-right"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Typography
              variant="h4"
              gutterBottom
              align="center"
              className="shimmer-text"
            >
              Meet the Creator
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Paper className="creator-card animated-card" elevation={0}>
                <div className="card-shine" />
                <Avatar
                  className="creator-avatar"
                  alt="Meet Dasalaniya"
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400"
                  sx={{ width: 100, height: 100, mx: "auto", mb: 2, display: "block" }}
                >
                  MD
                </Avatar>
                <Typography variant="h6" fontWeight="medium" className="shimmer-text" align="center">
                  Meet Dasalaniya
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="animated-fade"
                  align="center"
                >
                  Founder &amp; Developer of DoDesk
                </Typography>
              </Paper>
            </Box>
          </motion.div>

        </Container>
      </div>
    </>
  );
};

export default AboutUs;
























































































































// import React, { useEffect, useRef } from "react";
// import {
//   Box,
//   Container,
//   Typography,
//   Grid,
//   Paper,
//   Avatar,
//   useTheme,
//   useMediaQuery,
// } from "@mui/material";
// import {
//   AccessTime,
//   GroupWork,
//   AssignmentTurnedIn,
//   IntegrationInstructions,
// } from "@mui/icons-material";
// import { motion } from "framer-motion";
// import "./AboutUs.css";

// // Define feature data outside the component for better readability and potential reusability
// const featuresData = [
//   {
//     title: "Task Management",
//     description: "Easily create, assign, and manage tasks with smart workflows.",
//     icon: <AssignmentTurnedIn fontSize="large" />,
//   },
//   {
//     title: "Team Collaboration",
//     description: "Communicate, collaborate, and share feedback in real-time.",
//     icon: <GroupWork fontSize="large" />,
//   },
//   {
//     title: "Time Tracking",
//     description: "Track work hours, productivity, and project deadlines.",
//     icon: <AccessTime fontSize="large" />,
//   },
//   {
//     title: "Integrations",
//     description:
//       "Seamless integration with popular tools like Slack, GitHub, and Google Drive.",
//     icon: <IntegrationInstructions fontSize="large" />,
//   },
// ];

// // Animation variants for Framer Motion
// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.2,
//       delayChildren: 0.1,
//     },
//   },
// };

// const itemVariants = {
//   hidden: { y: 30, opacity: 0 },
//   visible: {
//     y: 0,
//     opacity: 1,
//     transition: {
//       type: "spring",
//       stiffness: 100,
//       damping: 12,
//     },
//   },
// };

// const heroVariants = {
//   hidden: { opacity: 0, y: -50 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.8,
//       ease: "easeOut",
//     },
//   },
// };

// const AboutUs = () => {
//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
//   const containerRef = useRef(null);

//   // Add scroll animations
//   useEffect(() => {
//     const observerOptions = {
//       threshold: 0.1,
//       rootMargin: "0px 0px -50px 0px",
//     };

//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add("visible");
//         }
//       });
//     }, observerOptions);

//     const animatedElements = document.querySelectorAll(
//       ".animate-fade-in, .animate-slide-left, .animate-slide-right"
//     );
//     animatedElements.forEach((el) => observer.observe(el));

//     return () => observer.disconnect();
//   }, []);

//   // Add floating particles effect
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     const createParticle = () => {
//       const particle = document.createElement("div");
//       particle.className = "particle";
//       particle.style.left = Math.random() * 100 + "%";
//       particle.style.animationDuration = Math.random() * 3 + 2 + "s";
//       particle.style.animationDelay = Math.random() * 2 + "s";

//       const particlesContainer = container.querySelector(".floating-particles");
//       if (particlesContainer) {
//         particlesContainer.appendChild(particle);

//         setTimeout(() => {
//           if (particle.parentNode) {
//             particle.parentNode.removeChild(particle);
//           }
//         }, 5000);
//       }
//     };

//     const particleInterval = setInterval(createParticle, 2000);
//     return () => clearInterval(particleInterval);
//   }, []);

//   return (
//     <div className="about-container" ref={containerRef}>
//       {/* Floating Particles */}
//       <div className="floating-particles">
//         <div className="particle"></div>
//         <div className="particle"></div>
//         <div className="particle"></div>
//         <div className="particle"></div>
//       </div>

//       <Container maxWidth="lg">
//         {/* Hero Section */}
//         <motion.div
//           className="about-hero animate-fade-in"
//           variants={heroVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           <Typography
//             variant={isSmallScreen ? "h4" : "h3"}
//             className="about-title"
//             gutterBottom
//             align="center"
//           >
//             <span className="animated-text gradient-text">About DoDesk</span>
//           </Typography>
//           <Typography
//             variant={isSmallScreen ? "body1" : "h6"}
//             className="about-subtitle animated-fade"
//             align="center"
//             sx={{ maxWidth: 800, mx: "auto" }}
//           >
//             DoDesk is your all-in-one project management solution built for teams
//             that want to move fast and collaborate smarter.
//           </Typography>
//         </motion.div>

//         {/* Features Grid */}
//         <Grid
//           container
//           spacing={isSmallScreen ? 2 : 4}
//           className="feature-grid animate-slide-left"
//           component={motion.div}
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           {featuresData.map((feature, idx) => (
//             <Grid item xs={12} sm={6} md={3} key={idx}>
//               <motion.div variants={itemVariants}>
//                 <Paper elevation={0} className="feature-card animated-card">
//                   <div className="card-shine"></div>
//                   <div className="animated-border"></div>
//                   <Box className="feature-icon">
//                     <div className="icon-glow"></div>
//                     {feature.icon}
//                   </Box>
//                   <Typography variant="h6" fontWeight="bold" gutterBottom>
//                     {feature.title}
//                   </Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     {feature.description}
//                   </Typography>
//                 </Paper>
//               </motion.div>
//             </Grid>
//           ))}
//         </Grid>

//         {/* Our Vision */}
//         <motion.div
//           className="about-vision animate-fade-in"
//           initial={{ opacity: 0, y: 50 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//         >
//           <Typography
//             variant="h4"
//             gutterBottom
//             align="center"
//             className="shimmer-text"
//           >
//             Our Vision
//           </Typography>
//           <Typography
//             variant="body1"
//             align="center"
//             sx={{ maxWidth: 800, mx: "auto" }}
//             className="animated-fade"
//           >
//             At DoDesk, our mission is to empower individuals and teams to do their
//             best work through simplicity, clarity, and connected workflows. We
//             believe productivity is not about doing more—it's about doing what
//             matters most.
//           </Typography>
//         </motion.div>

//         {/* Creator Section */}
//         <motion.div
//           className="about-creator animate-slide-right"
//           initial={{ opacity: 0, y: 50 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.5 }}
//         >
//           <Typography
//             variant="h4"
//             gutterBottom
//             align="center"
//             className="shimmer-text"
//           >
//             Meet the Creator
//           </Typography>
//           <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
//             <Paper className="creator-card animated-card" elevation={0}>
//               <div className="card-shine"></div>
//               <Avatar
//                 className="creator-avatar"
//                 alt="Meet Dasalaniya"
//                 src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400"
//                 sx={{
//                   width: 100,
//                   height: 100,
//                   mx: "auto",
//                   mb: 2,
//                 }}
//               >
//                 <div className="pulse-ring"></div>
//                 MD
//               </Avatar>
//               <Typography variant="h6" fontWeight="medium" className="shimmer-text">
//                 Meet Dasalaniya
//               </Typography>
//               <Typography
//                 variant="body2"
//                 color="text.secondary"
//                 className="animated-fade"
//               >
//                 Founder & Developer of DoDesk
//               </Typography>
//             </Paper>
//           </Box>
//         </motion.div>
//       </Container>
//     </div>
//   );
// };

// export default AboutUs;
