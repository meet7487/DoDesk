// src/Component/AIGuide.jsx

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Chip, CircularProgress, Divider,
  IconButton, LinearProgress,
} from "@mui/material";
import AutoAwesomeIcon   from "@mui/icons-material/AutoAwesome";
import CloseIcon         from "@mui/icons-material/Close";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import LightbulbIcon     from "@mui/icons-material/Lightbulb";
import FlagIcon          from "@mui/icons-material/Flag";
import TimerIcon         from "@mui/icons-material/Timer";
import InfoOutlinedIcon  from "@mui/icons-material/InfoOutlined";
import TrackChangesIcon  from "@mui/icons-material/TrackChanges";
import { useAuth }       from "../Context/AuthContext";
import "./AIGuide.css";

export default function AIGuide({ open, onClose, task, api: apiProp }) {
  const { api: authApi } = useAuth();
  const api              = apiProp || authApi;

  const [loading, setLoading] = useState(false);
  const [guide,   setGuide]   = useState(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (open && task) fetchGuide();
    if (!open) { setGuide(null); setError(""); }
  }, [open, task?._id]);

  const fetchGuide = async () => {
    if (!task) return;
    setLoading(true);
    setError("");
    setGuide(null);

    try {
      const res = await api.post("/api/ai/guide-task", {
        name:        task.name        || "",
        description: task.description || "",
        priority:    task.priority    || "Medium",
        status:      task.status      || "In progress",
      });
      setGuide(res.data);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "AI service is unavailable. Make sure OPENAI_API_KEY is set in your backend .env file.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const PRIORITY_STYLE = {
    High:   { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c" },
    Medium: { bg: "#fffbeb", border: "#fcd34d", color: "#b45309" },
    Low:    { bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
  };
  const pStyle = PRIORITY_STYLE[task?.priority] || PRIORITY_STYLE.Medium;
  const db = guide?.description_breakdown;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="ai-guide-dialog">

      {/* ── Header ── */}
      <DialogTitle className="ai-guide-title">
        <div className="ai-guide-title-row">
          <AutoAwesomeIcon className="ai-guide-title-icon" />
          <span>AI Completion Guide</span>
        </div>
        <IconButton size="small" onClick={onClose} className="ai-guide-close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="ai-guide-content" dividers>

        {/* ── Task header ── */}
        {task && (
          <div className="ai-guide-task-header">
            <Typography className="ai-guide-task-name">{task.name}</Typography>
            {task.description && (
              <Typography className="ai-guide-task-desc">{task.description}</Typography>
            )}
            <div className="ai-guide-task-chips">
              <Chip size="small" icon={<FlagIcon style={{ fontSize: "0.75rem" }} />}
                label={task.priority || "Medium"} className="ai-guide-chip"
                style={{ background: pStyle.bg, border: `1px solid ${pStyle.border}`, color: pStyle.color }} />
              <Chip size="small" label={task.status || "In progress"} className="ai-guide-chip ai-guide-status-chip" />
              {task.deadline && (
                <Chip size="small" label={`Due: ${new Date(task.deadline).toLocaleDateString()}`}
                  className="ai-guide-chip ai-guide-date-chip" />
              )}
            </div>
          </div>
        )}

        <Divider className="ai-guide-divider" />

        {/* ── Loading ── */}
        {loading && (
          <div className="ai-guide-loading">
            <CircularProgress size={28} className="ai-guide-spinner" />
            <Typography className="ai-guide-loading-text">Generating your detailed completion guide…</Typography>
            <LinearProgress className="ai-guide-progress" />
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="ai-guide-error">
            <Typography className="ai-guide-error-text">⚠ {error}</Typography>
            <Button size="small" className="ai-guide-retry-btn" onClick={fetchGuide} startIcon={<AutoAwesomeIcon />}>
              Try again
            </Button>
          </div>
        )}

        {/* ── Guide ── */}
        {guide && !loading && (
          <div className="ai-guide-body">

            {/* 1. Summary */}
            <div className="ai-guide-summary">
              <LightbulbIcon className="ai-guide-summary-icon" />
              <Typography className="ai-guide-summary-text">{guide.summary}</Typography>
            </div>

            {/* 2. Meta */}
            <div className="ai-guide-meta-row">
              <div className="ai-guide-meta-item">
                <TimerIcon style={{ fontSize: "0.9rem" }} />
                <span>Estimated: <strong>{guide.estimated_hours}h</strong></span>
              </div>
              <div className="ai-guide-meta-item">
                <FlagIcon style={{ fontSize: "0.9rem" }} />
                <span>Difficulty: <strong>{guide.difficulty}</strong></span>
              </div>
              {guide.tools_needed?.length > 0 && (
                <div className="ai-guide-meta-item">
                  <span>🛠 Tools: <strong>{guide.tools_needed.join(", ")}</strong></span>
                </div>
              )}
            </div>

            {/* 3. Description Breakdown */}
            {db && (db.what_it_means || db.why_it_matters || db.scope) && (
              <>
                <Typography className="ai-guide-section-label">Understanding the task</Typography>
                <div className="ai-guide-breakdown">

                  {db.what_it_means && (
                    <div className="ai-guide-breakdown-card ai-guide-breakdown-what">
                      <div className="ai-guide-breakdown-card-header">
                        <InfoOutlinedIcon className="ai-guide-breakdown-icon" />
                        <Typography className="ai-guide-breakdown-label">What it means</Typography>
                      </div>
                      <Typography className="ai-guide-breakdown-text">{db.what_it_means}</Typography>
                    </div>
                  )}

                  {db.why_it_matters && (
                    <div className="ai-guide-breakdown-card ai-guide-breakdown-why">
                      <div className="ai-guide-breakdown-card-header">
                        <TrackChangesIcon className="ai-guide-breakdown-icon" />
                        <Typography className="ai-guide-breakdown-label">Why it matters</Typography>
                      </div>
                      <Typography className="ai-guide-breakdown-text">{db.why_it_matters}</Typography>
                    </div>
                  )}

                  {db.scope && (
                    <div className="ai-guide-breakdown-card ai-guide-breakdown-scope">
                      <div className="ai-guide-breakdown-card-header">
                        <span className="ai-guide-breakdown-scope-icon">⬡</span>
                        <Typography className="ai-guide-breakdown-label">Scope &amp; boundaries</Typography>
                      </div>
                      <Typography className="ai-guide-breakdown-text">{db.scope}</Typography>
                    </div>
                  )}

                  {db.key_concepts?.length > 0 && (
                    <div className="ai-guide-breakdown-card ai-guide-breakdown-concepts">
                      <div className="ai-guide-breakdown-card-header">
                        <span className="ai-guide-breakdown-scope-icon">🔑</span>
                        <Typography className="ai-guide-breakdown-label">Key concepts to know</Typography>
                      </div>
                      <div className="ai-guide-concepts-chips">
                        {db.key_concepts.map((c, i) => (
                          <span key={i} className="ai-guide-concept-chip">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

            {/* 4. Steps */}
            <Typography className="ai-guide-section-label" style={{ marginTop: "var(--sp-5)" }}>
              Step-by-step guide
            </Typography>
            <div className="ai-guide-steps">
              {guide.steps.map((step, i) => (
                <div key={i} className="ai-guide-step">
                  <div className="ai-guide-step-num">{i + 1}</div>
                  <div className="ai-guide-step-body">
                    <Typography className="ai-guide-step-title">{step.title}</Typography>
                    <Typography className="ai-guide-step-detail">{step.detail}</Typography>
                    {step.sub_points?.length > 0 && (
                      <ul className="ai-guide-sub-points">
                        {step.sub_points.map((sp, j) => (
                          <li key={j} className="ai-guide-sub-point-item">
                            <span className="ai-guide-sub-point-dot" />
                            <Typography className="ai-guide-sub-point-text">{sp}</Typography>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 5. Expected outcome */}
            {guide.expected_outcome && (
              <>
                <Typography className="ai-guide-section-label" style={{ marginTop: "var(--sp-5)" }}>
                  Expected outcome
                </Typography>
                <div className="ai-guide-outcome">
                  <span className="ai-guide-outcome-icon">✓</span>
                  <Typography className="ai-guide-outcome-text">{guide.expected_outcome}</Typography>
                </div>
              </>
            )}

            {/* 6. Tips */}
            {guide.tips?.length > 0 && (
              <>
                <Typography className="ai-guide-section-label" style={{ marginTop: "var(--sp-5)" }}>
                  Tips &amp; best practices
                </Typography>
                <ul className="ai-guide-tips">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="ai-guide-tip-item">
                      <CheckCircleIcon className="ai-guide-tip-icon" />
                      <Typography className="ai-guide-tip-text">{tip}</Typography>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* 7. Watch out */}
            {guide.watch_out?.length > 0 && (
              <>
                <Typography className="ai-guide-section-label" style={{ marginTop: "var(--sp-5)" }}>
                  Watch out for
                </Typography>
                <ul className="ai-guide-watchlist">
                  {guide.watch_out.map((w, i) => (
                    <li key={i} className="ai-guide-watch-item">
                      <span className="ai-guide-watch-dot" />
                      <Typography className="ai-guide-watch-text">{w}</Typography>
                    </li>
                  ))}
                </ul>
              </>
            )}

          </div>
        )}
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions className="ai-guide-actions">
        {guide && (
          <Button size="small" startIcon={<AutoAwesomeIcon />} onClick={fetchGuide} className="ai-guide-regen-btn">
            Regenerate
          </Button>
        )}
        <Button onClick={onClose} className="ai-guide-close-btn">Close</Button>
      </DialogActions>

    </Dialog>
  );
}




















































// // src/Component/AIGuide.jsx
// // AI Task Completion Guide — opens as a dialog from a task row in the table.
// // Calls Google Gemini via FastAPI and returns a step-by-step completion guide.

// import React, { useState, useEffect } from "react";
// import {
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Button, Typography, Chip, CircularProgress, Divider,
//   IconButton, LinearProgress,
// } from "@mui/material";
// import AutoAwesomeIcon  from "@mui/icons-material/AutoAwesome";
// import CloseIcon        from "@mui/icons-material/Close";
// import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
// import LightbulbIcon    from "@mui/icons-material/Lightbulb";
// import FlagIcon         from "@mui/icons-material/Flag";
// import TimerIcon        from "@mui/icons-material/Timer";
// import { useAuth }      from "../Context/AuthContext";
// import "./AIGuide.css";

// export default function AIGuide({ open, onClose, task, api: apiProp }) {
//   const { api: authApi }  = useAuth();
//   const api               = apiProp || authApi;

//   const [loading,  setLoading]  = useState(false);
//   const [guide,    setGuide]    = useState(null);   // AI response
//   const [error,    setError]    = useState("");

//   // ── Auto-fetch when dialog opens with a new task ────────────
//   useEffect(() => {
//     if (open && task) {
//       fetchGuide();
//     }
//     if (!open) {
//       // Reset when closed so next open is fresh
//       setGuide(null);
//       setError("");
//     }
//   }, [open, task?._id]);

//   const fetchGuide = async () => {
//     if (!task) return;
//     setLoading(true);
//     setError("");
//     setGuide(null);

//     try {
//       const res = await api.post("/api/ai/guide-task", {
//         name:        task.name        || "",
//         description: task.description || "",
//         priority:    task.priority    || "Medium",
//         status:      task.status      || "In progress",
//       });
//       setGuide(res.data);
//     } catch (e) {
//       const msg =
//         e?.response?.data?.detail ||
//         e?.message ||
//         "AI service is unavailable. Make sure GEMINI_API_KEY is set in your backend .env file.";
//       setError(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const PRIORITY_STYLE = {
//     High:   { bg: "#fef2f2", border: "#fca5a5", color: "#b91c1c" },
//     Medium: { bg: "#fffbeb", border: "#fcd34d", color: "#b45309" },
//     Low:    { bg: "#f0fdf4", border: "#86efac", color: "#15803d" },
//   };

//   const pStyle = PRIORITY_STYLE[task?.priority] || PRIORITY_STYLE.Medium;

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       maxWidth="sm"
//       fullWidth
//       className="ai-guide-dialog"
//     >
//       {/* ── Header ── */}
//       <DialogTitle className="ai-guide-title">
//         <div className="ai-guide-title-row">
//           <AutoAwesomeIcon className="ai-guide-title-icon" />
//           <span>AI Completion Guide</span>
//         </div>
//         <IconButton size="small" onClick={onClose} className="ai-guide-close">
//           <CloseIcon fontSize="small" />
//         </IconButton>
//       </DialogTitle>

//       <DialogContent className="ai-guide-content" dividers>

//         {/* ── Task info header ── */}
//         {task && (
//           <div className="ai-guide-task-header">
//             <Typography className="ai-guide-task-name">
//               {task.name}
//             </Typography>
//             {task.description && (
//               <Typography className="ai-guide-task-desc">
//                 {task.description}
//               </Typography>
//             )}
//             <div className="ai-guide-task-chips">
//               <Chip
//                 size="small"
//                 icon={<FlagIcon style={{ fontSize: "0.75rem" }} />}
//                 label={task.priority || "Medium"}
//                 className="ai-guide-chip"
//                 style={{
//                   background: pStyle.bg,
//                   border:     `1px solid ${pStyle.border}`,
//                   color:      pStyle.color,
//                 }}
//               />
//               <Chip
//                 size="small"
//                 label={task.status || "In progress"}
//                 className="ai-guide-chip ai-guide-status-chip"
//               />
//               {task.deadline && (
//                 <Chip
//                   size="small"
//                   label={`Due: ${new Date(task.deadline).toLocaleDateString()}`}
//                   className="ai-guide-chip ai-guide-date-chip"
//                 />
//               )}
//             </div>
//           </div>
//         )}

//         <Divider className="ai-guide-divider" />

//         {/* ── Loading state ── */}
//         {loading && (
//           <div className="ai-guide-loading">
//             <CircularProgress size={28} className="ai-guide-spinner" />
//             <Typography className="ai-guide-loading-text">
//               Generating your completion guide…
//             </Typography>
//             <LinearProgress className="ai-guide-progress" />
//           </div>
//         )}

//         {/* ── Error state ── */}
//         {error && !loading && (
//           <div className="ai-guide-error">
//             <Typography className="ai-guide-error-text">⚠ {error}</Typography>
//             <Button
//               size="small"
//               className="ai-guide-retry-btn"
//               onClick={fetchGuide}
//               startIcon={<AutoAwesomeIcon />}
//             >
//               Try again
//             </Button>
//           </div>
//         )}

//         {/* ── Guide content ── */}
//         {guide && !loading && (
//           <div className="ai-guide-body">

//             {/* Summary */}
//             <div className="ai-guide-summary">
//               <LightbulbIcon className="ai-guide-summary-icon" />
//               <Typography className="ai-guide-summary-text">
//                 {guide.summary}
//               </Typography>
//             </div>

//             {/* Meta row — estimate + difficulty */}
//             <div className="ai-guide-meta-row">
//               <div className="ai-guide-meta-item">
//                 <TimerIcon style={{ fontSize: "0.9rem" }} />
//                 <span>Estimated: <strong>{guide.estimated_hours}h</strong></span>
//               </div>
//               <div className="ai-guide-meta-item">
//                 <FlagIcon style={{ fontSize: "0.9rem" }} />
//                 <span>Difficulty: <strong>{guide.difficulty}</strong></span>
//               </div>
//               {guide.tools_needed?.length > 0 && (
//                 <div className="ai-guide-meta-item">
//                   <span>🛠 Tools: <strong>{guide.tools_needed.join(", ")}</strong></span>
//                 </div>
//               )}
//             </div>

//             {/* Step-by-step guide */}
//             <Typography className="ai-guide-section-label">
//               Step-by-step guide
//             </Typography>
//             <div className="ai-guide-steps">
//               {guide.steps.map((step, i) => (
//                 <div key={i} className="ai-guide-step">
//                   <div className="ai-guide-step-num">{i + 1}</div>
//                   <div className="ai-guide-step-body">
//                     <Typography className="ai-guide-step-title">
//                       {step.title}
//                     </Typography>
//                     <Typography className="ai-guide-step-detail">
//                       {step.detail}
//                     </Typography>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Tips */}
//             {guide.tips?.length > 0 && (
//               <>
//                 <Typography className="ai-guide-section-label" style={{ marginTop: "var(--sp-5)" }}>
//                   Tips & best practices
//                 </Typography>
//                 <ul className="ai-guide-tips">
//                   {guide.tips.map((tip, i) => (
//                     <li key={i} className="ai-guide-tip-item">
//                       <CheckCircleIcon className="ai-guide-tip-icon" />
//                       <Typography className="ai-guide-tip-text">{tip}</Typography>
//                     </li>
//                   ))}
//                 </ul>
//               </>
//             )}

//             {/* Watch out for */}
//             {guide.watch_out?.length > 0 && (
//               <>
//                 <Typography className="ai-guide-section-label" style={{ marginTop: "var(--sp-5)" }}>
//                   Watch out for
//                 </Typography>
//                 <ul className="ai-guide-watchlist">
//                   {guide.watch_out.map((w, i) => (
//                     <li key={i} className="ai-guide-watch-item">
//                       <span className="ai-guide-watch-dot" />
//                       <Typography className="ai-guide-watch-text">{w}</Typography>
//                     </li>
//                   ))}
//                 </ul>
//               </>
//             )}

//           </div>
//         )}
//       </DialogContent>

//       {/* ── Footer ── */}
//       <DialogActions className="ai-guide-actions">
//         {guide && (
//           <Button
//             size="small"
//             startIcon={<AutoAwesomeIcon />}
//             onClick={fetchGuide}
//             className="ai-guide-regen-btn"
//           >
//             Regenerate
//           </Button>
//         )}
//         <Button onClick={onClose} className="ai-guide-close-btn">
//           Close
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }