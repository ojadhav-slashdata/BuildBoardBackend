const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const CATEGORY_CONTEXT = {
  'Technology': 'leveraging modern technology solutions',
  'Finance': 'optimizing financial processes and reporting',
  'Human Resources': 'improving employee experience and HR operations',
  'Marketing': 'enhancing brand visibility and customer engagement',
  'Operations': 'streamlining operational workflows and efficiency',
  'Product enhancement': 'elevating our product capabilities',
  'Customer Experience': 'delivering superior customer satisfaction',
  'Data & Analytics': 'unlocking data-driven insights and decision-making',
  'Security': 'strengthening our security posture and compliance',
  '': 'driving innovation across the organization',
};

const IMPACT_PHRASES = [
  'This will reduce manual effort and free up team capacity for higher-value work.',
  'The expected outcome is measurable improvement in team productivity and process reliability.',
  'By addressing this gap, we can unlock significant efficiency gains and reduce operational overhead.',
  'This initiative directly supports our goals of operational excellence and continuous improvement.',
  'Successful implementation will create a scalable foundation that benefits multiple teams.',
];

const PROBLEM_STARTERS = [
  'Currently, teams face challenges with',
  'There is a growing need to address',
  'Our existing approach to',
  'A key bottleneck exists in',
  'As the organization scales,',
];

router.post('/enhance-description', authenticate, async (req, res) => {
  const { title, notes, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const description = generateDescription(title, notes || '', category || '');
    res.json({ description });
  } catch (err) {
    console.error('[ai] enhance failed:', err.message);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

function generateDescription(title, notes, category) {
  const ctx = CATEGORY_CONTEXT[category] || CATEGORY_CONTEXT[''];
  const impact = IMPACT_PHRASES[Math.floor(Math.random() * IMPACT_PHRASES.length)];
  const starter = PROBLEM_STARTERS[Math.floor(Math.random() * PROBLEM_STARTERS.length)];

  const titleLower = title.toLowerCase();
  const notesClean = notes.trim();

  // Build problem statement
  let problem;
  if (notesClean) {
    problem = `${starter} ${titleLower}. ${notesClean.charAt(0).toUpperCase() + notesClean.slice(1)}${notesClean.endsWith('.') ? '' : '.'}`;
  } else {
    problem = `${starter} ${titleLower}, which currently involves significant manual effort and lacks the efficiency needed to keep pace with growing demands.`;
  }

  // Build solution paragraph
  const solution = `The proposed solution, "${title}", focuses on ${ctx}. By implementing this initiative, we aim to automate key workflows, improve visibility into critical metrics, and provide a streamlined experience for all stakeholders involved. The approach prioritizes practical, incremental delivery so that value is realized early and feedback can be incorporated throughout development.`;

  // Build impact paragraph
  const impactParagraph = `${impact} Additionally, this project will serve as a proof of concept for similar improvements across other departments, multiplying its long-term value to the organization.`;

  return `${problem}\n\n${solution}\n\n${impactParagraph}`;
}

module.exports = router;
