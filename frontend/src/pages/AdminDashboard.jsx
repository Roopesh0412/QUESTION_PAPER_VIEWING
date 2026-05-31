import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, HelpCircle, HardDrive, FileText, Plus, Trash2, 
  ToggleLeft, ToggleRight, Upload, LogOut, Search, AlertCircle, Edit, Lock, Unlock, RefreshCcw
} from 'lucide-react';
import api from '../api';
import MathJaxRenderer from '../components/MathJaxRenderer';

// Official NCERT syllabus mapping for Class 11 and 12
const ncertSyllabus = {
  "11th": {
    "Physics": {
      "Units and Measurements": ["SI Units", "Dimensional Analysis", "Errors in Measurement"],
      "Motion in a Straight Line": ["Position, Path Length and Displacement", "Average Velocity and Average Speed", "Instantaneous Velocity and Speed", "Acceleration"],
      "Motion in a Plane": ["Scalars and Vectors", "Resolution of Vectors", "Vector Addition", "Projectile Motion", "Uniform Circular Motion"],
      "Laws of Motion": ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Conservation of Momentum", "Friction", "Circular Motion"],
      "Work, Energy and Power": ["Work-Energy Theorem", "Kinetic Energy", "Work done by a Variable Force", "Potential Energy", "Conservation of Mechanical Energy", "Power", "Collisions"],
      "System of Particles and Rotational Motion": ["Center of Mass", "Linear Momentum of a System of Particles", "Vector Product of Two Vectors", "Angular Velocity", "Torque and Angular Momentum", "Equilibrium of a Rigid Body", "Moment of Inertia"],
      "Gravitation": ["Kepler's Laws", "Universal Law of Gravitation", "Acceleration due to Gravity", "Gravitational Potential Energy", "Escape Speed", "Earth Satellites"],
      "Mechanical Properties of Solids": ["Elastic Behaviour", "Stress and Strain", "Hooke's Law", "Elastic Moduli"],
      "Mechanical Properties of Fluids": ["Pressure", "Streamline Flow", "Bernoulli's Principle", "Viscosity", "Surface Tension"],
      "Thermal Properties of Matter": ["Temperature and Heat", "Thermal Expansion", "Specific Heat Capacity", "Calorimetry", "Latent Heat", "Heat Transfer"],
      "Thermodynamics": ["Thermal Equilibrium", "Zeroth Law of Thermodynamics", "First Law of Thermodynamics", "Thermodynamic Processes", "Heat Engines and Refrigerators", "Second Law of Thermodynamics"],
      "Kinetic Theory": ["Molecular Nature of Matter", "Behaviour of Gases", "Law of Equipartition of Energy", "Specific Heat Capacity", "Mean Free Path"],
      "Oscillations": ["Periodic and Oscillatory Motions", "Simple Harmonic Motion", "Damped Simple Harmonic Motion", "Forced Oscillations and Resonance"],
      "Waves": ["Transverse and Longitudinal Waves", "Displacement Relation in a Progressive Wave", "Speed of a Travelling Wave", "Principle of Superposition of Waves", "Beats", "Doppler Effect"]
    },
    "Chemistry": {
      "Some Basic Concepts of Chemistry": ["Properties of Matter", "Laws of Chemical Combination", "Dalton's Atomic Theory", "Atomic and Molecular Masses", "Mole Concept", "Stoichiometry"],
      "Structure of Atom": ["Sub-atomic Particles", "Bohr's Model for Hydrogen Atom", "Quantum Mechanical Model of Atom", "Electronic Configurations"],
      "Classification of Elements and Periodicity in Properties": ["Modern Periodic Law", "Periodic Trends in Properties of Elements"],
      "Chemical Bonding and Molecular Structure": ["Kossel-Lewis Approach", "Ionic Bonding", "Covalent Bonding", "VSEPR Theory", "Valence Bond Theory", "Hybridisation", "Molecular Orbital Theory"],
      "Thermodynamics": ["Thermodynamic Terms", "Applications", "Enthalpy Change", "Spontaneity", "Gibbs Energy Change and Equilibrium"],
      "Equilibrium": ["Equilibrium in Physical Processes", "Equilibrium in Chemical Processes", "Law of Chemical Equilibrium", "Homogeneous & Heterogeneous Equilibria", "Ionic Equilibrium", "Buffer Solutions", "Solubility Product"],
      "Redox Reactions": ["Classical Idea of Redox", "Oxidation Number", "Balancing Redox Reactions"],
      "Organic Chemistry – Some Basic Principles and Techniques": ["General Introduction", "Tetravalence of Carbon", "Structural Representations", "Classification & Nomenclature", "Isomerism", "Fundamental Concepts in Organic Reaction Mechanisms", "Purification of Organic Compounds"],
      "Hydrocarbons": ["Alkanes", "Alkenes", "Alkynes", "Aromatic Hydrocarbons"]
    },
    "Mathematics": {
      "Sets": ["Sets and their Representations", "The Empty Set", "Finite and Infinite Sets", "Equal Sets", "Subsets", "Power Set", "Universal Set", "Venn Diagrams", "Operations on Sets"],
      "Relations and Functions": ["Cartesian Product of Sets", "Relations", "Functions"],
      "Trigonometric Functions": ["Angles", "Trigonometric Functions", "Trigonometric Equations"],
      "Complex Numbers and Quadratic Equations": ["Complex Numbers", "Algebra of Complex Numbers", "Argand Plane and Polar Representation", "Quadratic Equations"],
      "Linear Inequalities": ["Inequalities", "Algebraic Solutions of Linear Inequalities", "Graphical Solution"],
      "Permutations and Combinations": ["Fundamental Principle of Counting", "Permutations", "Combinations"],
      "Binomial Theorem": ["Binomial Theorem for Positive Integral Indices", "General and Middle Terms"],
      "Sequences and Series": ["Sequences", "Series", "Arithmetic Progression (AP)", "Geometric Progression (GP)", "Relationship between AM and GM"],
      "Straight Lines": ["Slope of a Line", "Various Forms of the Equation of a Line", "Distance of a Point From a Line"],
      "Conic Sections": ["Sections of a Cone", "Circle", "Parabola", "Ellipse", "Hyperbola"],
      "Introduction to Three-Dimensional Geometry": ["Coordinate Axes and Coordinate Planes", "Coordinates of a Point in Space", "Distance between Two Points", "Section Formula"],
      "Limits and Derivatives": ["Limits", "Intuitive Idea of Derivatives", "Limits of Trigonometric Functions", "Derivatives"],
      "Statistics": ["Measures of Dispersion", "Range", "Mean Deviation", "Variance and Standard Deviation", "Analysis of Frequency Distributions"],
      "Probability": ["Random Experiments", "Event", "Axiomatic Approach to Probability"]
    },
    "Biology": {
      "The Living World": ["What is Living?", "Diversity in the Living World", "Taxonomic Categories", "Taxonomical Aids"],
      "Biological Classification": ["Kingdom Monera", "Kingdom Protista", "Kingdom Fungi", "Kingdom Plantae", "Kingdom Animalia", "Viruses, Viroids and Lichens"],
      "Plant Kingdom": ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms", "Plant Life Cycles"],
      "Animal Kingdom": ["Basis of Classification", "Classification of Animals"],
      "Morphology of Flowering Plants": ["The Root", "The Stem", "The Leaf", "The Inflorescence", "The Flower", "The Fruit", "The Seed", "Semi-technical Description of a Flowering Plant"],
      "Anatomy of Flowering Plants": ["The Tissues", "The Tissue System", "Anatomy of Dicotyledonous and Monocotonous Plants", "Secondary Growth"],
      "Structural Organisation in Animals": ["Animal Tissues", "Organ and Organ System", "Earthworm", "Cockroach", "Frogs"],
      "Cell: The Unit of Life": ["What is a Cell?", "Cell Theory", "An Overview of Cell", "Prokaryotic Cells", "Eukaryotic Cells"],
      "Biomolecules": ["How to Analyse Chemical Composition?", "Primary and Secondary Metabolites", "Biomacromolecules", "Proteins", "Polysaccharides", "Nucleic Acids", "Structure of Proteins", "Nature of Bond Linking Monomers in a Polymer", "Dynamic State of Body Constituents", "Concept of Metabolism", "Metabolic Basis for Living", "The Living State", "Enzymes"],
      "Cell Cycle and Cell Division": ["Cell Cycle", "M Phase", "Significance of Mitosis", "Meiosis", "Significance of Meiosis"],
      "Photosynthesis in Higher Plants": ["What do we know?", "Early Experiments", "Where does Photosynthesis take place?", "How many Pigments are involved in Photosynthesis?", "What is Light Reaction?", "The Electron Transport", "Where are the ATP and NADPH Used?", "The C4 Pathway", "Photorespiration", "Factors affecting Photosynthesis"],
      "Respiration in Plants": ["Do Plants Breathe?", "Glycolysis", "Fermentation", "Aerobic Respiration", "The Respiratory Balance Sheet", "Amphibolic Pathway", "Respiratory Quotient"],
      "Plant Growth and Development": ["Growth", "Differentiation, Dedifferentiation and Redifferentiation", "Development", "Plant Growth Regulators", "Photoperiodism", "Vernalisation"],
      "Breathing and Exchange of Gases": ["Respiratory Organs", "Mechanism of Breathing", "Exchange of Gases", "Transport of Gases", "Regulation of Respiration", "Disorders of Respiratory System"],
      "Body Fluids and Circulation": ["Blood", "Lymph (Tissue Fluid)", "Circulatory Pathways", "Double Circulation", "Regulation of Cardiac Activity", "Disorders of Circulatory System"],
      "Excretory Products and their Elimination": ["Human Excretory System", "Urine Formation", "Function of the Tubules", "Mechanism of Concentration of the Filtrate", "Regulation of Kidney Function", "Micturition", "Role of other Organs in Excretion", "Disorders of the Excretory System"],
      "Locomotion and Movement": ["Types of Movement", "Muscle", "Skeletal System", "Joints", "Disorders of Muscular and Skeletal System"],
      "Neural Control and Coordination": ["Neural System", "Human Neural System", "Neuron as Structural and Functional Unit of Neural System", "Central Neural System", "Reflex Action and Reflex Arc", "Sensory Reception and Processing"],
      "Chemical Coordination and Integration": ["Endocrine Glands and Hormones", "Human Endocrine System", "Hormones of Heart, Kidney and Gastrointestinal Tract", "Mechanism of Hormone Action"]
    }
  }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('teachers');

  // Check if logged in user is manchestertechnologiess@gmail.com
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isMantech = user && user.email.toLowerCase() === 'manchestertechnologiess@gmail.com';

  useEffect(() => {
    if (activeTab === 'questions' && !isMantech) {
      setActiveTab('teachers');
    }
  }, [activeTab, isMantech]);
  
  // Teachers state
  const [teachers, setTeachers] = useState([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('Physics');
  const [newTeacherRole, setNewTeacherRole] = useState('teacher');
  const [teacherMsg, setTeacherMsg] = useState('');
  const [teacherErr, setTeacherErr] = useState('');

  // Questions Panel list states
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [qPage, setQPage] = useState(1);
  const [qPages, setQPages] = useState(1);
  const [qLimit] = useState(10);
  const [qSearch, setQSearch] = useState('');
  
  // Tag Filters in Question Bank
  const [qFilterSubject, setQFilterSubject] = useState('');
  const [selectedQClass, setSelectedQClass] = useState('');
  const [isQClassLocked, setIsQClassLocked] = useState(false);
  const [qFilterChapter, setqFilterChapter] = useState('');
  const [qFilterConcept, setqFilterConcept] = useState('');
  const [qFilterExam, setqFilterExam] = useState('');
  const [qFilterType, setqFilterType] = useState('');
  const [qFilterDifficulty, setqFilterDifficulty] = useState('');
  const [selectedQIds, setSelectedQIds] = useState([]);
  
  // Create / Edit Question Form states
  const [editingQId, setEditingQId] = useState(null); // Tracks active edit question
  const [qFormClass, setqFormClass] = useState('11th');
  const [isFormClassLocked, setIsFormClassLocked] = useState(true);
  const [qSubject, setQSubject] = useState('Physics');
  const [qChapter, setQChapter] = useState('');
  const [qConcept, setQConcept] = useState('');
  const [qText, setQText] = useState('');
  const [qExamType, setQExamType] = useState('JEE');
  const [qType, setQType] = useState('Multiple Choice'); // MCQ or Numerical
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qOptionImages, setQOptionImages] = useState(['', '', '', '']);
  const [qAnswer, setQAnswer] = useState('A');
  const [qNumericalAnswer, setQNumericalAnswer] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [qDetailedSolution, setqDetailedSolution] = useState('');
  const [qSolutionImageUrl, setqSolutionImageUrl] = useState('');

  // Chapter & Concept lists for Create Form and Viewing Filters
  const [formChapters, setFormChapters] = useState([]);
  const [formConcepts, setFormConcepts] = useState([]);
  const [filterChapters, setFilterChapters] = useState([]);
  const [filterConcepts, setFilterConcepts] = useState([]);
  const [filterConceptCounts, setFilterConceptCounts] = useState({});
  const [activeConceptInfo, setActiveConceptInfo] = useState(null);

  // Bulk JSON state
  const [bulkJson, setBulkJson] = useState('');
  const [qMsg, setQMsg] = useState('');
  const [qErr, setQErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [sessionMsg, setSessionMsg] = useState('');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logEmail, setLogEmail] = useState('');
  const [logAction, setLogAction] = useState('');

  const subjectsList = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const loaderRef = useRef(null);
  const formRef = useRef(null);

  // ----------------------------------------------------
  // Sync NCERT mappings for Form and Filters
  // ----------------------------------------------------
  // Sync form chapters & concepts
  useEffect(() => {
    if (qFormClass && qSubject) {
      const classData = ncertSyllabus[qFormClass]?.[qSubject] || {};
      const chaps = Object.keys(classData);
      setFormChapters(chaps);
      
      // Auto pre-populate first chapter if none active
      if (chaps.length > 0 && !chaps.includes(qChapter)) {
        setQChapter(chaps[0]);
      }
    }
  }, [qFormClass, qSubject]);

  useEffect(() => {
    if (qFormClass && qSubject && qChapter) {
      const conceptsList = ncertSyllabus[qFormClass]?.[qSubject]?.[qChapter] || [];
      setFormConcepts(conceptsList);
      if (conceptsList.length > 0 && !conceptsList.includes(qConcept)) {
        setQConcept(conceptsList[0]);
      }
    }
  }, [qFormClass, qSubject, qChapter]);

  // Sync viewing filter chapters & concepts
  const fetchChaptersFromDB = useCallback(async (sub) => {
    if (!sub) return;
    try {
      const res = await api.get('/teachers/chapters', { params: { subject: sub } });
      setFilterChapters(res.data.chapters);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const sub = qFilterSubject || 'Physics';
    if (selectedQClass) {
      const classData = ncertSyllabus[selectedQClass]?.[sub] || {};
      setFilterChapters(Object.keys(classData));
      
      if (qFilterChapter && classData[qFilterChapter]) {
        setFilterConcepts(classData[qFilterChapter]);
      } else {
        setFilterConcepts([]);
        setqFilterConcept('');
      }
    } else {
      fetchChaptersFromDB(sub);
      setFilterConcepts([]);
      setqFilterConcept('');
    }
  }, [selectedQClass, qFilterSubject, qFilterChapter, fetchChaptersFromDB]);

  // Load concept question counts for filter view
  useEffect(() => {
    const loadConceptCounts = async () => {
      const sub = qFilterSubject || 'Physics';
      if (!qFilterChapter) {
        setFilterConceptCounts({});
        return;
      }
      try {
        const res = await api.get('/teachers/concepts-count', {
          params: { subject: sub, chapter: qFilterChapter }
        });
        const counts = {};
        res.data.concepts.forEach(c => {
          counts[c.concept] = c.count;
        });
        setFilterConceptCounts(counts);
      } catch (err) {
        console.error('Error fetching concept counts:', err);
      }
    };
    loadConceptCounts();
  }, [qFilterSubject, qFilterChapter]);


  // ----------------------------------------------------
  // API Calls - Teachers
  // ----------------------------------------------------
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setTeacherMsg('');
    setTeacherErr('');
    try {
      await api.post('/admin/teachers', {
        email: newTeacherEmail,
        subject: newTeacherSubject,
        role: newTeacherRole,
        is_active: true
      });
      setTeacherMsg('Teacher account added successfully.');
      setNewTeacherEmail('');
      fetchTeachers();
    } catch (err) {
      setTeacherErr(err.response?.data?.detail || 'Failed to add teacher.');
    }
  };

  const handleToggleTeacherStatus = async (teacherId, currentStatus) => {
    try {
      await api.put(`/admin/teachers/${teacherId}`, {
        is_active: !currentStatus
      });
      fetchTeachers();
      if (activeTab === 'sessions') fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to permanently delete this teacher account?')) return;
    try {
      await api.delete(`/admin/teachers/${teacherId}`);
      fetchTeachers();
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // API Calls - Questions Panel (CRUD)
  // ----------------------------------------------------
  const fetchQuestions = useCallback(async (pageToFetch) => {
    setLoading(true);
    setQErr('');
    try {
      const res = await api.get('/teachers/questions', {
        params: {
          subject: qFilterSubject || undefined,
          chapter: qFilterChapter || undefined,
          search: qSearch || undefined,
          class: selectedQClass || undefined,
          exam_type: qFilterExam || undefined,
          question_type: qFilterType || undefined,
          difficulty_level: qFilterDifficulty || undefined,
          concept: qFilterConcept || undefined,
          page: pageToFetch,
          limit: qLimit
        }
      });
      
      if (pageToFetch === 1) {
        setQuestions(res.data.questions);
      } else {
        setQuestions(prev => {
          const ids = new Set(prev.map(q => q._id));
          const uniq = res.data.questions.filter(q => !ids.has(q._id));
          return [...prev, ...uniq];
        });
      }
      setTotal(res.data.total);
      setQPages(res.data.pages);
    } catch (err) {
      console.error(err);
      setQErr('Failed to retrieve question library.');
    } finally {
      setLoading(false);
    }
  }, [qFilterSubject, qFilterChapter, qSearch, selectedQClass, qFilterExam, qFilterType, qFilterDifficulty, qFilterConcept, qLimit]);

  // Infinite Scroll Observer for Admin Dashboard Question List
  useEffect(() => {
    if (activeTab !== 'questions' || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && qPage < qPages) {
        setQPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading, qPage, qPages, activeTab]);

  // Sync Page 1 loading on viewing filters change
  useEffect(() => {
    if (activeTab === 'questions') {
      setSelectedQIds([]);
      setQPage(1);
      fetchQuestions(1);
    }
  }, [qFilterSubject, qFilterChapter, qSearch, selectedQClass, qFilterExam, qFilterType, qFilterDifficulty, qFilterConcept, activeTab, fetchQuestions]);

  // Sync Next Page queries
  useEffect(() => {
    if (activeTab === 'questions' && qPage > 1) {
      fetchQuestions(qPage);
    }
  }, [qPage, activeTab, fetchQuestions]);


  // Helper file uploader reading base64 data url
  const handleFileChange = (file, callback) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setQErr('Only image files are allowed.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setQErr('Image size should be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setQMsg('');
    setQErr('');

    const isNumerical = qType === 'Numerical';
    
    // Validations
    if (!isNumerical) {
      if (qOptions.some(opt => !opt.trim())) {
        setQErr('All four option fields are required for MCQs.');
        return;
      }
    } else {
      if (!qNumericalAnswer.trim()) {
        setQErr('A numerical answer is required.');
        return;
      }
    }

    const payload = {
      subject: qSubject,
      chapter: qChapter,
      question: qText,
      options: isNumerical ? [] : qOptions,
      answer: isNumerical ? qNumericalAnswer : qAnswer,
      image_url: qImageUrl || '',
      class: qFormClass,
      exam_type: qExamType,
      question_type: qType,
      difficulty_level: qDifficulty,
      concept: qConcept || '',
      detailed_solution: qDetailedSolution || '',
      solution_image_url: qSolutionImageUrl || '',
      option_images: isNumerical ? ['', '', '', ''] : qOptionImages
    };

    try {
      if (editingQId) {
        // Edit payload using PUT
        await api.put(`/admin/questions/${editingQId}`, payload);
        setQMsg('Question updated successfully.');
        setEditingQId(null);
      } else {
        // Create payload using POST
        await api.post('/admin/questions', payload);
        setQMsg('Question created successfully.');
      }
      
      // Clean form fields
      setQText('');
      setQOptions(['', '', '', '']);
      setQOptionImages(['', '', '', '']);
      setQNumericalAnswer('');
      setQImageUrl('');
      setqDetailedSolution('');
      setqSolutionImageUrl('');
      
      setQPage(1);
      fetchQuestions(1);
    } catch (err) {
      setQErr(err.response?.data?.detail || 'Failed to submit question.');
    }
  };

  const startEditQuestion = (q) => {
    setEditingQId(q._id);
    setqFormClass(q.class || '11th');
    setQSubject(q.subject);
    setQChapter(q.chapter);
    setQConcept(q.concept || '');
    setQText(q.question);
    setQExamType(q.exam_type || 'JEE');
    setQType(q.question_type || 'Multiple Choice');
    setQDifficulty(q.difficulty_level || 'Medium');
    
    const isNum = (q.question_type === 'Numerical' || !q.options || q.options.length === 0);
    if (isNum) {
      setQNumericalAnswer(q.answer);
      setQOptions(['', '', '', '']);
      setQOptionImages(['', '', '', '']);
    } else {
      setQOptions(q.options);
      setQAnswer(q.answer);
      setQOptionImages(q.option_images && q.option_images.length > 0 ? q.option_images : ['', '', '', '']);
      setQNumericalAnswer('');
    }
    
    setQImageUrl(q.image_url || '');
    setqDetailedSolution(q.detailed_solution || '');
    setqSolutionImageUrl(q.solution_image_url || '');

    // Scroll directly to creation form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingQId(null);
    setQText('');
    setQOptions(['', '', '', '']);
    setQOptionImages(['', '', '', '']);
    setQNumericalAnswer('');
    setQImageUrl('');
    setqDetailedSolution('');
    setqSolutionImageUrl('');
  };

  const escapeJsonBackslashes = (jsonStr) => {
    let result = '';
    let inString = false;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      if (inString) {
        if (char === '\\') {
          const nextChar = jsonStr[i + 1];
          if (nextChar === '"') {
            result += '\\"';
            i++;
          } else {
            result += '\\\\';
          }
        } else if (char === '"') {
          result += char;
          inString = false;
        } else {
          result += char;
        }
      } else {
        if (char === '"') {
          inString = true;
        }
        result += char;
      }
    }
    return result;
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setQMsg('');
    setQErr('');
    try {
      const escapedJson = escapeJsonBackslashes(bulkJson);
      const parsed = JSON.parse(escapedJson);
      const payload = Array.isArray(parsed) ? parsed : [parsed];
      
      const res = await api.post('/admin/questions/bulk', payload);
      setQMsg(res.data.message);
      setBulkJson('');
      setQPage(1);
      fetchQuestions(1);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setQErr('Invalid JSON syntax. Ensure it matches NCERT bulk format.');
      } else {
        setQErr(err.response?.data?.detail || 'Bulk upload failed.');
      }
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await api.delete(`/admin/questions/${qId}`);
      setQPage(1);
      fetchQuestions(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDeleteQuestions = async () => {
    if (selectedQIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete the ${selectedQIds.length} selected questions?`)) return;
    
    setQMsg('');
    setQErr('');
    try {
      const res = await api.post('/admin/questions/bulk-delete', selectedQIds);
      setQMsg(res.data.message);
      setSelectedQIds([]);
      setQPage(1);
      fetchQuestions(1);
    } catch (err) {
      setQErr(err.response?.data?.detail || 'Failed to bulk delete questions.');
    }
  };

  const handleConceptFilterClick = async (cName) => {
    if (!cName) return;
    try {
      const res = await api.get('/teachers/concepts-count', { params: { concept: cName } });
      setActiveConceptInfo({ name: cName, count: res.data.count });
      setqFilterConcept(cName);
      setqFilterChapter('');
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // API Calls - Active Sessions
  // ----------------------------------------------------
  const fetchSessions = async () => {
    try {
      const res = await api.get('/admin/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceLogout = async (email, sessionId) => {
    if (!window.confirm(`Force logout user ${email}?`)) return;
    setSessionMsg('');
    try {
      await api.post('/admin/sessions/force-logout', { email, session_id: sessionId });
      setSessionMsg(`Successfully terminated session for ${email}.`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // API Calls - Audit Logs
  // ----------------------------------------------------
  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          email: logEmail || undefined,
          action: logAction || undefined
        }
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Router loaders
  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeachers();
    } else if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'logs') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* Page Title */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl border border-slate-700/50 shadow-lg">
        <div>
          <span className="text-brand-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
            <HardDrive className="w-4 h-4" />
            System Control Panel
          </span>
          <h1 className="text-2xl font-black mt-1">Manchester Admin Dashboard</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'teachers' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teachers CRUD</span>
        </button>
        {isMantech && (
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'questions' 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Questions Panel</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'sessions' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Active Sessions ({sessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'logs' 
              ? 'bg-brand-600 text-white shadow-md' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Security Logs</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB: TEACHERS CRUD                                    */}
      {/* ==================================================== */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-600" />
              Add Teacher Account
            </h2>
            
            {teacherMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold mb-4 border border-emerald-100">
                {teacherMsg}
              </div>
            )}
            {teacherErr && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold mb-4 border border-red-100">
                {teacherErr}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@domain.com"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Subject Assignment</label>
                <select
                  value={newTeacherSubject}
                  onChange={(e) => setNewTeacherSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                >
                  {subjectsList.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="All">All Subjects (Admin Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Access Role</label>
                <select
                  value={newTeacherRole}
                  onChange={(e) => setNewTeacherRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Add Teacher Account
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold mb-4">Authorized Accounts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {teachers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="py-3 font-semibold">{t.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                          {t.subject}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs capitalize">{t.role}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleToggleTeacherStatus(t._id, t.is_active)}
                          className="focus:outline-none"
                        >
                          {t.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded text-xs font-bold">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded text-xs font-bold">
                              Suspended
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 text-center">
                        {t.email !== 'admin@manchester.com' && (
                          <button
                            onClick={() => handleDeleteTeacher(t._id)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: QUESTIONS MANAGEMENT                            */}
      {/* ==================================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form component (reusable for Create & Edit) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                <Plus className="w-5 h-5 text-brand-600" />
                {editingQId ? 'Edit Question' : 'Add Single Question'}
              </h2>

              {qMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold mb-4 border border-emerald-100">
                  {qMsg}
                </div>
              )}
              {qErr && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold mb-4 border border-red-100">
                  {qErr}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* Class Mapping Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>NCERT Class</span>
                      <button 
                        type="button"
                        onClick={() => setIsFormClassLocked(!isFormClassLocked)}
                        className="text-[10px] text-brand-600 font-bold"
                      >
                        {isFormClassLocked ? 'Unlock' : 'Lock'}
                      </button>
                    </label>
                    <select
                      value={qFormClass}
                      disabled={isFormClassLocked}
                      onChange={(e) => {
                        setqFormClass(e.target.value);
                        setQChapter('');
                        setQConcept('');
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white disabled:opacity-70"
                    >
                      <option value="11th">Class 11th</option>
                      <option value="12th">Class 12th</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                    <select
                      value={qSubject}
                      onChange={(e) => {
                        setQSubject(e.target.value);
                        setQChapter('');
                        setQConcept('');
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      {subjectsList.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Chapter Name</label>
                    <select
                      value={qChapter}
                      onChange={(e) => {
                        setQChapter(e.target.value);
                        setQConcept('');
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      {formChapters.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Concept</label>
                    <select
                      value={qConcept}
                      onChange={(e) => setQConcept(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      {formConcepts.map((con) => (
                        <option key={con} value={con}>{con}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Exam Target</label>
                    <select
                      value={qExamType}
                      onChange={(e) => setQExamType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="KCET">KCET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assessment Type</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      <option value="Multiple Choice">Multiple Choice (MCQ)</option>
                      <option value="Numerical">Numerical Assessment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Difficulty Level</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Question Body (HTML & LaTeX allowed)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter question text here."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white font-mono"
                  />
                </div>

                {/* Main Question Image */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Question Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0], setQImageUrl)}
                    className="w-full text-xs text-slate-500"
                  />
                  {qImageUrl && (
                    <div className="mt-2 relative w-fit">
                      <img src={qImageUrl} alt="Preview" className="max-h-24 rounded border" />
                      <button 
                        type="button" 
                        onClick={() => setQImageUrl('')} 
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* MCQ Options Fields vs Numerical Field */}
                {qType === 'Multiple Choice' ? (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-slate-400 border-b pb-1">MCQ Options</span>
                    
                    {qOptions.map((opt, oIdx) => {
                      const label = String.fromCharCode(65 + oIdx);
                      const displayVal = opt.startsWith(`${label}. `) ? opt.substring(3) : opt;

                      return (
                        <div key={oIdx} className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-black text-slate-400">{label}</span>
                            <input
                              type="text"
                              required
                              placeholder={`Option ${label}`}
                              value={displayVal}
                              onChange={(e) => {
                                const updated = [...qOptions];
                                updated[oIdx] = `${label}. ${e.target.value}`;
                                setQOptions(updated);
                              }}
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              id={`opt-img-input-${oIdx}`}
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files[0], (data) => {
                                const updated = [...qOptionImages];
                                updated[oIdx] = data;
                                setQOptionImages(updated);
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`opt-img-input-${oIdx}`).click()}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-xs font-semibold"
                            >
                              Add Image
                            </button>
                          </div>

                          {qOptionImages[oIdx] && (
                            <div className="ml-5 mt-1.5 relative w-fit">
                              <img src={qOptionImages[oIdx]} alt="Option preview" className="max-h-16 rounded border" />
                              <button 
                                type="button" 
                                onClick={() => {
                                  const updated = [...qOptionImages];
                                  updated[oIdx] = '';
                                  setQOptionImages(updated);
                                }} 
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px]"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Correct Option</label>
                      <select
                        value={qAnswer}
                        onChange={(e) => setQAnswer(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>

                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-500">Correct Numerical Value</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5.8 or -12"
                      value={qNumericalAnswer}
                      onChange={(e) => setQNumericalAnswer(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white font-mono"
                    />
                  </div>
                )}

                {/* Detailed Solution Block */}
                <div className="border-t pt-3 mt-4 space-y-3">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Solution Details</span>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-550 mb-1">Solution Explanation Text</label>
                    <textarea
                      rows={2}
                      placeholder="Enter detailed solution text..."
                      value={qDetailedSolution}
                      onChange={(e) => setqDetailedSolution(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-550 mb-1">Solution Diagram Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files[0], setqSolutionImageUrl)}
                      className="w-full text-xs text-slate-500"
                    />
                    {qSolutionImageUrl && (
                      <div className="mt-2 relative w-fit">
                        <img src={qSolutionImageUrl} alt="Solution preview" className="max-h-24 rounded border animate-fade-in" />
                        <button 
                          type="button" 
                          onClick={() => setqSolutionImageUrl('')} 
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px]"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg text-sm transition-all"
                  >
                    {editingQId ? 'Save Changes' : 'Create Question'}
                  </button>
                  {editingQId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm transition-all"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* Bulk Upload Block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-brand-600" />
                  Bulk Upload via JSON
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Paste a JSON array of question documents. Parameters: `Question`, `Options` (MCQ only), `Answer`, `Class`, `Difficulty Level`, `Concept`, `Image Url`, `Solution`, `Solution Image Url`, `Option Images`.
                </p>
                
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <textarea
                    rows={12}
                    required
                    placeholder={`[\n  {\n    "class": "11th",\n    "subject": "Physics",\n    "chapter": "Motion in a Plane",\n    "concept": "Projectile Motion",\n    "difficulty_level": "Medium",\n    "question_type": "Multiple Choice",\n    "question": "A projectile is thrown at...",\n    "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],\n    "option_images": ["urlA", "", "", ""],\n    "answer": "A",\n    "detailed_solution": "Detailed math explanation...",\n    "solution_image_url": "urlSolution"\n  }\n]`}
                    value={bulkJson}
                    onChange={(e) => setBulkJson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold rounded-lg text-sm transition-all"
                  >
                    Run Bulk Upload
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Question viewing library */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold">Existing Question Library</h2>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white flex-1 md:flex-initial"
                />

                <select
                  value={selectedQClass}
                  onChange={(e) => setSelectedQClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white"
                >
                  <option value="">All Classes</option>
                  <option value="11th">Class 11th</option>
                  <option value="12th">Class 12th</option>
                </select>

                <select
                  value={qFilterSubject}
                  onChange={(e) => setQFilterSubject(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white"
                >
                  <option value="">All Subjects</option>
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={qFilterChapter}
                  onChange={(e) => setQFilterChapter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white"
                >
                  <option value="">All Chapters</option>
                  {filterChapters.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced tags row filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl mb-4 border border-slate-100 dark:border-slate-850">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Target Exam</label>
                <select
                  value={qFilterExam}
                  onChange={(e) => setQFilterExam(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded text-xs dark:text-white cursor-pointer"
                >
                  <option value="">All Exams</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="KCET">KCET</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Question Type</label>
                <select
                  value={qFilterType}
                  onChange={(e) => setQFilterType(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded text-xs dark:text-white cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="Multiple Choice">MCQ</option>
                  <option value="Numerical">Numerical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Difficulty</label>
                <select
                  value={qFilterDifficulty}
                  onChange={(e) => setQFilterDifficulty(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded text-xs dark:text-white cursor-pointer"
                >
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Concept</label>
                <select
                  value={qFilterConcept}
                  onChange={(e) => setqFilterConcept(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded text-xs dark:text-white cursor-pointer"
                >
                  <option value="">All Concepts</option>
                  {selectedQClass && filterConcepts.map((con) => {
                    const count = filterConceptCounts[con] || 0;
                    return (
                      <option key={con} value={con}>
                        {con} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

            </div>

            {/* Interactive Concept Banner */}
            {activeConceptInfo && (
              <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 rounded-lg border border-brand-100 dark:border-brand-900/30 flex justify-between items-center text-xs font-semibold">
                <span>Concept: <strong>{activeConceptInfo.name}</strong> ({activeConceptInfo.count} questions)</span>
                <button onClick={() => { setActiveConceptInfo(null); setqFilterConcept(''); }} className="hover:underline text-[10px]">Clear Filter</button>
              </div>
            )}

            {/* Bulk Selection Bar */}
            {questions.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-850 mb-4 text-xs">
                <label className="flex items-center gap-2 font-bold cursor-pointer select-none text-slate-600 dark:text-slate-450">
                  <input
                    type="checkbox"
                    checked={questions.length > 0 && questions.every(q => selectedQIds.includes(q._id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = questions.map(q => q._id);
                        setSelectedQIds(prev => Array.from(new Set([...prev, ...allIds])));
                      } else {
                        const pageIds = questions.map(q => q._id);
                        setSelectedQIds(prev => prev.filter(id => !pageIds.includes(id)));
                      }
                    }}
                    className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                  />
                  <span>Select All ({questions.length} on page)</span>
                </label>

                {selectedQIds.length > 0 && (
                  <div className="flex items-center gap-3 animate-fade-in">
                    <span className="font-extrabold text-brand-655 dark:text-brand-400">
                      {selectedQIds.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDeleteQuestions}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-655 hover:bg-red-500 text-white rounded-lg font-bold shadow transition-all hover:scale-105"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedQIds([])}
                      className="text-slate-400 hover:text-slate-600 font-bold hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Questions Grid mapping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => {
                const isSelected = selectedQIds.includes(q._id);
                const isNum = (q.question_type === 'Numerical' || !q.options || q.options.length === 0);

                return (
                  <div 
                    key={q._id} 
                    className={`border p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 relative group transition-all ${
                      isSelected 
                        ? 'border-brand-500/60 ring-1 ring-brand-500/25 bg-brand-50/5 dark:bg-brand-950/15' 
                        : 'border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    
                    {/* Bulk Delete Checkbox */}
                    <div className="absolute top-4 left-4 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedQIds(prev => 
                            prev.includes(q._id) 
                              ? prev.filter(id => id !== q._id) 
                              : [...prev, q._id]
                          );
                        }}
                        className="w-4 h-4 text-brand-600 border-slate-350 dark:border-slate-800 rounded focus:ring-brand-500 cursor-pointer"
                      />
                    </div>

                    {/* Question Actions (Edit & Delete) */}
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={() => startEditQuestion(q)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded"
                        title="Edit Question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question Data Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2 pl-7 pr-12">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase">
                        {q.subject}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase">
                        {q.chapter}
                      </span>
                      {q.class && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-[9px] font-black text-blue-600 dark:text-blue-400">
                          Class {q.class}
                        </span>
                      )}
                      {q.exam_type && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-[9px] font-black text-purple-600 dark:text-purple-400">
                          {q.exam_type}
                        </span>
                      )}
                      {q.question_type && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-[9px] font-black text-amber-600 dark:text-amber-400">
                          {q.question_type}
                        </span>
                      )}
                      {q.difficulty_level && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500">
                          {q.difficulty_level}
                        </span>
                      )}
                      {q.concept && (
                        <button 
                          onClick={() => handleConceptFilterClick(q.concept)}
                          className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 text-[9px] font-black text-teal-600 dark:text-teal-400 cursor-pointer"
                        >
                          Concept: {q.concept}
                        </button>
                      )}
                    </div>
                    
                    {/* Question Content */}
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 pr-8 pl-7 leading-snug">
                      <MathJaxRenderer content={q.question} />
                    </div>

                    {q.image_url && (
                      <div className="my-2.5 max-w-full overflow-hidden rounded border border-slate-200 bg-white">
                        <img 
                          src={q.image_url} 
                          alt="Question diagram" 
                          className="max-h-24 w-auto object-contain mx-auto" 
                        />
                      </div>
                    )}

                    {/* Options list */}
                    {!isNum && q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500 font-medium">
                        {q.options.map((opt, oIdx) => {
                          const oImg = q.option_images && q.option_images[oIdx];
                          return (
                            <div key={oIdx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 px-2.5 py-1.5 rounded truncate flex flex-col gap-1">
                              <MathJaxRenderer content={opt} />
                              {oImg && <img src={oImg} alt="Option diagram" className="max-h-12 w-auto object-contain" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between items-center">
                      <span>Correct Answer: {q.answer}</span>
                    </div>

                    {/* Solutions info */}
                    {(q.detailed_solution || q.solution_image_url) && (
                      <div className="mt-2.5 p-2 bg-slate-100/50 dark:bg-slate-900/30 rounded border text-[11px] text-slate-500 font-semibold space-y-1">
                        <span className="block font-black text-slate-400 uppercase text-[9px] tracking-wide">Explanation:</span>
                        {q.detailed_solution && <p className="line-clamp-2">{q.detailed_solution}</p>}
                        {q.solution_image_url && <span className="text-[10px] text-blue-500 block">Has solution diagram</span>}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Continuous scroll loader */}
            <div ref={loaderRef} className="py-8 text-center flex justify-center items-center">
              {loading && (
                <div className="flex gap-1 items-center text-slate-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce delay-100"></span>
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce delay-200"></span>
                  <span>Loading more question resources...</span>
                </div>
              )}
              {!loading && qPage >= qPages && questions.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions scroll complete</span>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: ACTIVE SESSIONS                                 */}
      {/* ==================================================== */}
      {activeTab === 'sessions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Active User Sessions</h2>
            <button
              onClick={fetchSessions}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh Sessions
            </button>
          </div>

          {sessionMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold mb-4 border border-emerald-100">
              {sessionMsg}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No active single-device sessions registered in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">Teacher Email</th>
                    <th className="pb-3">Session ID</th>
                    <th className="pb-3">Device Identity</th>
                    <th className="pb-3">Login Timestamp</th>
                    <th className="pb-3 text-center">Terminate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85">
                  {sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="py-3 font-semibold">{s.email}</td>
                      <td className="py-3 font-mono text-xs">{s.session_id}</td>
                      <td className="py-3 font-mono text-xs">{s.device_id}</td>
                      <td className="py-3 text-xs">{new Date(s.login_time).toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleForceLogout(s.email, s.session_id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded text-xs font-bold"
                        >
                          Force Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: AUDIT LOGS                                      */}
      {/* ==================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold">Security Audit Trail</h2>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Filter email..."
                value={logEmail}
                onChange={(e) => setLogEmail(e.target.value)}
                className="px-3 py-1.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white w-full sm:w-36"
              />
              <input
                type="text"
                placeholder="Filter action..."
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                className="px-3 py-1.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs dark:text-white w-full sm:w-36"
              />
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm relative">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                <tr className="border-b border-slate-205 dark:border-slate-800 text-slate-400 font-bold text-xs uppercase">
                  <th className="pb-3 bg-white dark:bg-slate-900">Timestamp</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">Actor Email</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">Action Type</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">IP Address</th>
                  <th className="pb-3 bg-white dark:bg-slate-900">Device ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                {auditLogs.map((l) => {
                  const isSuspicious = l.action.includes('unauthorized') || l.action.includes('restricted');
                  return (
                    <tr 
                      key={l._id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-850/50 ${
                        isSuspicious ? 'bg-red-500/5 text-red-500 dark:text-red-400 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 font-sans font-semibold">{l.email}</td>
                      <td className="py-2.5 font-bold uppercase tracking-tight">
                        {isSuspicious ? '⚠️ ' : ''}{l.action}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-655 dark:text-slate-400">{l.ip_address}</td>
                      <td className="py-2.5 font-semibold text-slate-500">{l.device_id.substring(0, 12)}...</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
