import React, { useMemo, useEffect } from "react";
import {
  Target, MessageCircle, FileText, TrendingUp,
  Settings, Users, Clock, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./Home.css";

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // ease-out
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const cardHoverVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.03, 
    transition: { duration: 0.3, ease: "easeOut" }
  },
  tap: { scale: 0.98 }
};

const Home = () => {
  const benefits = useMemo(() => [
    ["Gain Crystal-Clear Project Visibility", "See the big picture and the smallest details."],
    ["Empower Seamless Team Collaboration",   "Work together, effortlessly."],
    ["Achieve On-Time, On-Budget Delivery",   "Hit your goals, every time."],
    ["Boost Productivity & Reduce Stress",    "Focus on what truly matters."],
    ["Make Data-Driven Decisions",            "Optimize your processes with intelligent insights."],
  ], []);

  const features = useMemo(() => [
    { title: "Intuitive Task Management",      desc: "Organize and prioritize tasks with drag-and-drop simplicity",   icon: Target        },
    { title: "Centralized Communication Hub",  desc: "Keep all team conversations in one place",                      icon: MessageCircle },
    { title: "Collaborative Document Sharing", desc: "Share and edit documents in real-time",                         icon: FileText      },
    { title: "Real-time Progress Tracking",    desc: "Monitor project progress with live updates",                    icon: TrendingUp    },
    { title: "Customizable Workflows",         desc: "Adapt the system to your team's unique processes",              icon: Settings      },
    { title: "Resource Management",            desc: "Allocate and track resources efficiently",                      icon: Users         },
    { title: "Time Tracking",                  desc: "Accurate time logging and reporting",                           icon: Clock         },
    { title: "Secure & Scalable",              desc: "Enterprise-grade security that grows with you",                 icon: Shield        },
  ], []);

  const beneficiaries = useMemo(() => [
    ["Software Development Teams",  "Agile sprints, bug tracking, and release management."],
    ["Marketing Agencies",          "Campaign planning, content creation, and client management."],
    ["Construction Firms",          "Project scheduling, resource allocation, and progress monitoring."],
    ["Consulting Companies",        "Client engagement, deliverable tracking, and team collaboration."],
    ["Remote Teams",                "Bridging geographical gaps with seamless communication and shared workspaces."],
    ["Any Team",                    "Looking to bring structure, clarity, and efficiency to their projects!"],
  ], []);

  const testimonials = useMemo(() => [
    [
      "DoDesk has completely transformed how our team manages projects. The intuitive interface and powerful features have increased our productivity by 40%.",
      "Jane Doe, CEO of InnovateCorp",
    ],
    [
      "Finally, a project management system that's powerful yet incredibly easy to use. Our team was up and running in minutes, not days.",
      "John Smith, Project Lead at Creative Solutions",
    ],
    [
      "Our remote team struggled with collaboration until we found DoDesk. Now we work together seamlessly across three continents.",
      "Emily White, Marketing Director at Global Reach",
    ],
  ], []);

  useEffect(() => {
    document.title = "DoDesk — Your Command Center";

    /* —— Keep Grok-style background —— */
    const createStarfield = () => {
      const container = document.querySelector(".starfield");
      if (!container) return;
      container.innerHTML = "";

      for (let i = 0; i < 320; i++) {
        const star   = document.createElement("div");
        const size   = Math.random();
        const bright = Math.random();

        star.className =
          size < 0.30  ? "star star-small"  :
          size < 0.62  ? "star star-medium" :
          size < 0.86  ? "star star-large"  : "star star-bright";

        star.style.left              = Math.random() * 100 + "%";
        star.style.top               = Math.random() * 100 + "%";
        star.style.animationDelay    = (Math.random() * 6) + "s";
        star.style.animationDuration = (Math.random() * 3 + 2) + "s";
        star.style.setProperty("--brightness", bright);
        container.appendChild(star);
      }
    };

    const createShootingStars = () => {
      const container = document.querySelector(".starfield");
      if (!container) return;

      for (let i = 0; i < 6; i++) {
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
    createShootingStars();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ width: "100%" }}
    >
      <div className="grok-background">
        <div className="starfield" />
      </div>

      <main className="main-content">
        {/* —— HERO —— */}
        <section className="hero">
          <div className="container">
            <motion.div 
              className="hero-content"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h1 variants={itemVariants} className="hero-title">
                <span className="title-line">
                  DoDesk : Your Command Center for
                </span>
                <span className="gradient-text glitch-text"
                  data-text="Project Success!">
                  Project Success!
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="hero-subtitle">
                Welcome to DoDesk — Where Projects Get Done! Revolutionize the way
                you manage your projects with our intuitive, all-in-one platform.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* —— ABOUT / BENEFITS —— */}
        <section className="section about-section" id="about">
          <div className="container">
            <motion.div 
              className="section-header"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 variants={itemVariants} className="section-title">
                <span className="title-decoration animated-bar" />
                <h4>What is DoDesk? Your Ultimate Project Management Solution.</h4>
                <span className="title-decoration animated-bar" />
              </motion.h2>
              <motion.p variants={itemVariants} className="section-description">
                DoDesk is a comprehensive project management system meticulously
                crafted to empower teams of all sizes to achieve extraordinary results.
              </motion.p>
            </motion.div>

            <motion.div 
              className="benefits-grid"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="benefits-content">
                <motion.h3 variants={itemVariants} className="benefits-title shimmer-text">
                  DoDesk helps you:
                </motion.h3>
                <ul className="benefits-list">
                  {benefits.map(([title, desc], i) => (
                    <motion.li 
                      key={i}
                      variants={itemVariants}
                      whileHover="hover"
                      whileTap="tap"
                      custom={i}
                      className="benefit-item animated-card"
                    >
                      <div className="benefit-icon">
                        <div className="icon-inner">✓</div>
                      </div>
                      <div className="benefit-content">
                        <strong className="benefit-title">{title}</strong>
                        <span className="benefit-desc">{desc}</span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* —— FEATURES —— */}
        <section className="section features-section" id="features">
          <div className="container">
            <motion.div 
              className="section-header"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 variants={itemVariants} className="section-title">
                <span className="title-decoration animated-bar" />
                <h4>Why Choose DoDesk? Features That Set Us Apart</h4>
                <span className="title-decoration animated-bar" />
              </motion.h2>
            </motion.div>

            <motion.div 
              className="features-grid"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="feature-card animated-card"
                >
                  <div className="feature-icon-container">
                    <feature.icon className="feature-icon" size={44} />
                    <div className="icon-glow" />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* —— BENEFICIARIES —— */}
        <section className="section beneficiaries-section" id="who-can-benefit">
          <div className="container">
            <motion.div 
              className="section-header"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 variants={itemVariants} className="section-title">
                <span className="title-decoration animated-bar" />
                <h4>Who Can Benefit from DoDesk?</h4>
                <span className="title-decoration animated-bar" />
              </motion.h2>
              <motion.p variants={itemVariants} className="section-description">
                DoDesk is ideal for:
              </motion.p>
            </motion.div>

            <motion.div 
              className="beneficiaries-grid"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {beneficiaries.map(([title, desc], i) => (
                <motion.div 
                  key={i}
                  variants={cardHoverVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className="beneficiary-card animated-card"
                >
                  <div className="beneficiary-content">
                    <h4 className="beneficiary-title">{title}</h4>
                    <p className="beneficiary-desc">{desc}</p>
                  </div>
                  <div className="card-accent" />
                  <div className="hover-wave" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* —— TESTIMONIALS —— */}
        <section className="section testimonials-section" id="testimonials">
          <div className="container">
            <motion.div 
              className="section-header"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 variants={itemVariants} className="section-title">
                <span className="title-decoration animated-bar" />
                <h4>What Our Users Say</h4>
                <span className="title-decoration animated-bar" />
              </motion.h2>
            </motion.div>

            <motion.div 
              className="testimonials-grid"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {testimonials.map(([text, author], i) => (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="testimonial-card animated-card"
                >
                  <div className="testimonial-content">
                    <div className="quote-icon">
                      <span className="quote-mark">"</span>
                    </div>
                    <p className="testimonial-text">{text}</p>
                    <div className="testimonial-author">
                      <div className="author-avatar" />
                      <span className="author-name">{author}</span>
                    </div>
                  </div>
                  <div className="card-backdrop" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* —— CTA —— */}
        <section className="cta-section">
          <div className="container">
            <motion.div 
              className="cta-content"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 variants={itemVariants} className="cta-title">
                <span className="cosmic-text"
                  data-text="Ready to Transform Your Project Management?">
                  Ready to Transform Your Project Management?
                </span>
              </motion.h2>
              <motion.p variants={itemVariants} className="cta-description">
                Join thousands of successful teams who trust DoDesk to deliver
                exceptional results. Start your free trial today and experience
                the difference.
              </motion.p>
            </motion.div>

            <div className="floating-orbs">
              <div className="floating-orb orb-1" />
              <div className="floating-orb orb-2" />
              <div className="floating-orb orb-3" />
              <div className="floating-orb orb-4" />
            </div>
          </div>
        </section>

      </main>
    </motion.div>
  );
};

export default Home;