import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, RefreshCcw, Eye, EyeOff, BookOpen, AlertCircle, Lock, Unlock, HelpCircle } from 'lucide-react';
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
  },
  "12th": {
    "Physics": {
      "Electric Charges and Fields": ["Electric Charge", "Conductors and Insulators", "Charging by Induction", "Basic Properties of Electric Charge", "Coulomb's Law", "Forces between Multiple Charges", "Electric Field", "Electric Field Lines", "Electric Flux", "Electric Dipole", "Dipole in a Uniform External Field", "Continuous Charge Distribution", "Gauss's Law", "Applications of Gauss's Law"],
      "Electrostatic Potential and Capacitance": ["Electrostatic Potential", "Potential due to a Point Charge", "Potential due to an Electric Dipole", "Potential due to a System of Charges", "Equipotential Surfaces", "Potential Energy of a System of Charges", "Potential Energy in an External Field", "Electrostatics of Conductors", "Dielectrics and Polarisation", "Capacitors and Capacitance", "The Parallel Plate Capacitor", "Effect of Dielectric on Capacitance", "Combination of Capacitors", "Energy Stored in a Capacitor"],
      "Current Electricity": ["Electric Current", "Electric Currents in Conductors", "Ohm's Law", "Drift of Electrons and the Origin of Resistivity", "Limitations of Ohm's Law", "Resistivity of Various Materials", "Temperature Dependence of Resistivity", "Electrical Energy, Power", "Cells, EMF, Internal Resistance", "Cells in Series and in Parallel", "Kirchhoff's Rules", "Wheatstone Bridge", "Meter Bridge", "Potentiometer"],
      "Moving Charges and Magnetism": ["Magnetic Force", "Motion in a Magnetic Field", "Motion in Combined Electric and Magnetic Fields", "Magnetic Field due to a Current Element, Biot-Savart Law", "Magnetic Field on the Axis of a Circular Current Loop", "Ampere's Circuital Law", "The Solenoid and the Toroid", "Force between Two Parallel Currents, the Ampere", "Torque on Current Loop, Magnetic Dipole", "The Moving Coil Galvanometer"],
      "Magnetism and Matter": ["The Bar Magnet", "Magnetism and Gauss's Law", "The Earth's Magnetism", "Magnetisation and Magnetic Intensity", "Magnetic Properties of Materials", "Permanent Magnets and Electromagnets"],
      "Electromagnetic Induction": ["The Experiments of Faraday and Henry", "Magnetic Flux", "Faraday's Law of Induction", "Lenz's Law and Conservation of Energy", "Motional Electromotive Force", "Energy Consideration: A Quantitative Study", "Eddy Currents", "Inductance", "AC Generator"],
      "Alternating Current": ["AC Voltage Applied to a Resistor", "Representation of AC Current and Voltage by Rotating Vectors - Phasors", "AC Voltage Applied to an Inductor", "AC Voltage Applied to a Capacitor", "AC Voltage Applied to a Series LCR Circuit", "Power in AC Circuit: The Power Factor", "LC Oscillations", "Transformers"],
      "Electromagnetic Waves": ["Displacement Current", "Electromagnetic Waves", "Electromagnetic Spectrum"],
      "Ray Optics and Optical Instruments": ["Reflection of Light by Spherical Mirrors", "Refraction", "Total Internal Reflection", "Refraction at Spherical Surfaces and by Lenses", "Refraction through a Prism", "Dispersion by a Prism", "Some Natural Phenomena due to Sunlight", "Optical Instruments"],
      "Wave Optics": ["Huygens Principle", "Refraction and Reflection of Plane Waves using Huygens Principle", "Coherent and Incoherent Addition of Waves", "Interference of Light Waves and Young's Experiment", "Diffraction", "Polarisation"],
      "Dual Nature of Radiation and Matter": ["Electron Emission", "Photoelectric Effect", "Experimental Study of Photoelectric Effect", "Photoelectric Effect and Wave Theory of Light", "Einstein's Photoelectric Equation: Energy Quantum of Radiation", "Particle Nature of Light: The Photon", "Wave Nature of Matter", "Davisson and Germer Experiment"],
      "Atoms": ["Alpha-particle Scattering and Rutherford's Nuclear Model of Atom", "Atomic Spectra", "Bohr Model of the Hydrogen Atom", "The Line Spectra of the Hydrogen Atom", "De Broglie's Explanation of Bohr's Second Postulate of Quantisation"],
      "Nuclei": ["Atomic Masses and Composition of Nucleus", "Size of the Nucleus", "Mass-Energy and Nuclear Binding Energy", "Nuclear Force", "Radioactivity", "Nuclear Energy", "Nuclear Fission", "Nuclear Fusion"],
      "Semiconductor Electronics: Materials, Devices and Simple Circuits": ["Classification of Metals, Conductors and Semiconductors", "Intrinsic Semiconductor", "Extrinsic Semiconductor", "p-n Junction", "Semiconductor Diode", "Application of Junction Diode as a Rectifier", "Special Purpose p-n Junction Diodes", "Junction Transistor", "Digital Electronics and Logic Gates", "Integrated Circuits"]
    },
    "Chemistry": {
      "Solutions": ["Types of Solutions", "Expressing Concentration of Solutions", "Solubility", "Vapour Pressure of Liquid Solutions", "Ideal and Non-ideal Solutions", "Colligative Properties and Determination of Molar Mass", "Abnormal Molar Masses"],
      "Electrochemistry": ["Electrochemical Cells", "Galvanic Cells", "Nernst Equation", "Conductance of Electrolytic Solutions", "Electrolytic Cells and Electrolysis", "Batteries", "Fuel Cells", "Corrosion"],
      "Chemical Kinetics": ["Rate of a Chemical Reaction", "Factors Influencing Rate of a Reaction", "Integrated Rate Equations", "Pseudo First Order Reaction", "Temperature Dependence of the Rate of a Reaction", "Collision Theory of Chemical Reactions"],
      "d- and f-Block Elements": ["Position in the Periodic Table", "Electronic Configurations of the d-Block Elements", "General Properties of the Transition Elements (d-Block)", "Some Important Compounds of Transition Elements", "The Lanthanoids", "The Actinoids", "Some Applications of d and f-Block Elements"],
      "Coordination Compounds": ["Werner's Theory of Coordination Compounds", "Definitions of Some Important Terms Pertaining to Coordination Compounds", "Nomenclature of Coordination Compounds", "Isomerism in Coordination Compounds", "Bonding in Coordination Compounds", "Bonding in Metal Carbonyls", "Importance and Applications of Coordination Compounds"],
      "Haloalkanes and Haloarenes": ["Classification", "Nomenclature", "Nature of C-X Bond", "Methods of Preparation of Haloalkanes", "Preparation of Haloarenes", "Physical Properties", "Chemical Reactions", "Polyhalogen Compounds"],
      "Alcohols, Phenols and Ethers": ["Classification", "Nomenclature", "Structures of Functional Groups", "Alcohols and Phenols", "Some Commercially Important Alcohols", "Ethers"],
      "Aldehydes, Ketones and Carboxylic Acids": ["Nomenclature and Structure of Carbonyl Group", "Preparation of Aldehydes and Ketones", "Physical Properties", "Chemical Reactions", "Uses of Aldehydes and Ketones", "Nomenclature and Structure of Carboxyl Group", "Methods of Preparation of Carboxylic Acids", "Physical Properties", "Chemical Reactions", "Uses of Carboxylic Acids"],
      "Amines": ["Structure of Amines", "Classification", "Nomenclature", "Preparation of Amines", "Physical Properties", "Chemical Reactions", "Method of Preparation of Diazonium Salts", "Physical Properties", "Chemical Reactions", "Importance of Diazonium Salts in Synthesis of Aromatic Compounds"],
      "Biomolecules": ["Carbohydrates", "Proteins", "Enzymes", "Vitamins", "Nucleic Acids", "Hormones"]
    },
    "Mathematics": {
      "Relations and Functions": ["Types of Relations", "Types of Functions", "Composition of Functions and Invertible Function", "Binary Operations"],
      "Inverse Trigonometric Functions": ["Introduction", "Basic Concepts", "Properties of Inverse Trigonometric Functions"],
      "Matrices": ["Matrix", "Types of Matrices", "Operations on Matrices", "Transpose of a Matrix", "Symmetric and Skew Symmetric Matrices", "Elementary Operation of a Matrix", "Invertible Matrices"],
      "Determinants": ["Determinant", "Properties of Determinants", "Area of a Triangle", "Minors and Cofactors", "Adjoint and Inverse of a Matrix", "Applications of Matrices and Determinants"],
      "Continuity and Differentiability": ["Continuity", "Differentiability", "Exponential and Logarithmic Functions", "Logarithmic Differentiation", "Derivatives of Functions in Parametric Forms", "Second Order Derivative", "Mean Value Theorem"],
      "Application of Derivatives": ["Rate of Change of Quantities", "Increasing and Decreasing Functions", "Tangents and Normals", "Approximations", "Maxima and Minima"],
      "Integrals": ["Integration as an Inverse Process of Differentiation", "Methods of Integration", "Integrals of Some Particular Functions", "Integration by Partial Fractions", "Integration by Parts", "Definite Integral", "Fundamental Theorem of Calculus", "Evaluation of Definite Integrals by Substitution", "Some Properties of Definite Integrals"],
      "Application of Integrals": ["Area under Simple Curves", "Area between Two Curves"],
      "Differential Equations": ["Basic Concepts", "General and Particular Solutions of a Differential Equation", "Formation of a Differential Equation whose General Solution is given", "Methods of Solving First Order, First Degree Differential Equations"],
      "Vector Algebra": ["Some Basic Concepts", "Types of Vectors", "Addition of Vectors", "Multiplication of a Vector by a Scalar", "Product of Two Vectors"],
      "Three Dimensional Geometry": ["Direction Cosines and Direction Ratios of a Line", "Equation of a Line in Space", "Angle between Two Lines", "Shortest Distance between Two Lines", "Plane", "Coplanarity of Two Lines", "Angle between Two Planes", "Distance of a Point from a Plane", "Angle between a Line and a Plane"],
      "Linear Programming": ["Linear Programming Problem and its Mathematical Formulation", "Different Types of Linear Programming Problems"],
      "Probability": ["Conditional Probability", "Multiplication Theorem on Probability", "Independent Events", "Bayes' Theorem", "Random Variables and its Probability Distributions", "Bernoulli Trials and Binomial Distribution"]
    },
    "Biology": {
      "Sexual Reproduction in Flowering Plants": ["Flower - A Fascinating Organ of Angiosperms", "Pre-fertilisation: Structures and Events", "Double Fertilisation", "Post-fertilisation: Structures and Events", "Apomixis and Polyembryony"],
      "Human Reproduction": ["The Male Reproductive System", "The Female Reproductive System", "Gametogenesis", "Menstrual Cycle", "Fertilisation and Implantation", "Pregnancy and Embryonic Development", "Parturition and Lactation"],
      "Reproductive Health": ["Reproductive Health - Problems and Strategies", "Population Explosion and Birth Control", "Medical Termination of Pregnancy (MTP)", "Sexually Transmitted Diseases (STDs)", "Infertility"],
      "Principles of Inheritance and Variation": ["Mendel's Laws of Inheritance", "Inheritance of One Gene", "Inheritance of Two Genes", "Sex Determination", "Mutation", "Genetic Disorders"],
      "Molecular Basis of Inheritance": ["The DNA", "The Search for Genetic Material", "RNA World", "Replication", "Transcription", "Genetic Code", "Translation", "Regulation of Gene Expression", "Human Genome Project", "DNA Fingerprinting"],
      "Evolution": ["Origin of Life", "Evolution of Life Forms - A Theory", "What are the Evidences for Evolution?", "What is Adaptive Radiation?", "Biological Evolution", "Mechanism of Evolution", "Hardy-Weinberg Principle", "A Brief Account of Evolution", "Origin and Evolution of Man"],
      "Human Health and Disease": ["Common Diseases in Humans", "Immunity", "AIDS", "Cancer", "Drugs and Alcohol Abuse"],
      "Microbes in Human Welfare": ["Microbes in Household Products", "Microbes in Industrial Products", "Microbes in Sewage Treatment", "Microbes in Production of Biogas", "Microbes as Biocontrol Agents", "Microbes as Biofertilisers"],
      "Biotechnology: Principles and Processes": ["Principles of Biotechnology", "Tools of Recombinant DNA Technology", "Processes of Recombinant DNA Technology"],
      "Biotechnology and its Applications": ["Biotechnological Applications in Agriculture", "Biotechnological Applications in Medicine", "Transgenic Animals", "Ethical Issues"],
      "Organisms and Populations": ["Organism and Its Environment", "Populations"],
      "Ecosystem": ["Ecosystem - Structure and Function", "Productivity", "Decomposition", "Energy Flow", "Ecological Pyramids", "Ecological Succession", "Nutrient Cycling", "Ecosystem Services"],
      "Biodiversity and Conservation": ["Biodiversity", "Biodiversity Conservation"]
    }
  }
};

export default function TeacherDashboard() {
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [conceptCounts, setConceptCounts] = useState({});
  const [total, setTotal] = useState(0);
  
  // Infinite Scroll State
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10); // Infinite scroll works best with a larger limit like 10
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Auth User Details
  const [subject, setSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Primary Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isClassLocked, setIsClassLocked] = useState(false);
  const [chapter, setChapter] = useState('');
  const [concept, setConcept] = useState('');
  const [examType, setExamType] = useState('');
  const [qType, setQType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // Interactive Concept counts indicator
  const [activeConceptInfo, setActiveConceptInfo] = useState(null);

  const loaderRef = useRef(null);

  // Initialize teacher details
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setSubject(u.subject);
      setSelectedSubject(u.subject === 'All' ? 'Physics' : u.subject);
    }
  }, []);

  // Fetch unique chapters dynamically from DB if class is not selected
  const fetchChaptersFromDB = useCallback(async (sub) => {
    if (!sub) return;
    try {
      const res = await api.get('/teachers/chapters', {
        params: { subject: sub }
      });
      setChapters(res.data.chapters);
    } catch (err) {
      console.error('Failed to fetch chapters:', err);
    }
  }, []);

  // Sync Syllabus Mapping
  useEffect(() => {
    if (!selectedSubject) return;

    if (selectedClass) {
      // Map NCERT Chapters statically
      const subjData = ncertSyllabus[selectedClass]?.[selectedSubject] || {};
      setChapters(Object.keys(subjData));
      
      // Map concepts statically if chapter is active
      if (chapter && subjData[chapter]) {
        setConcepts(subjData[chapter]);
      } else {
        setConcepts([]);
        setConcept('');
      }
    } else {
      // Load chapters from Database dynamically
      fetchChaptersFromDB(selectedSubject);
      setConcepts([]);
      setConcept('');
    }
  }, [selectedClass, selectedSubject, chapter, fetchChaptersFromDB]);

  // Load concept question counts whenever subject/chapter changes
  useEffect(() => {
    const loadConceptCounts = async () => {
      if (!selectedSubject || !chapter) {
        setConceptCounts({});
        return;
      }
      try {
        const res = await api.get('/teachers/concepts-count', {
          params: { subject: selectedSubject, chapter }
        });
        const counts = {};
        res.data.concepts.forEach(c => {
          counts[c.concept] = c.count;
        });
        setConceptCounts(counts);
      } catch (err) {
        console.error('Error fetching concept counts:', err);
      }
    };
    loadConceptCounts();
  }, [selectedSubject, chapter]);

  // Main API retrieve function
  const fetchQuestions = useCallback(async (pageToFetch) => {
    if (!selectedSubject) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teachers/questions', {
        params: {
          subject: selectedSubject,
          chapter: chapter,
          search: search,
          class: selectedClass,
          exam_type: examType,
          question_type: qType,
          difficulty_level: difficulty,
          concept: concept,
          page: pageToFetch,
          limit: limit
        }
      });
      
      if (pageToFetch === 1) {
        setQuestions(res.data.questions);
      } else {
        setQuestions(prev => {
          const existingIds = new Set(prev.map(q => q._id));
          const fresh = res.data.questions.filter(q => !existingIds.has(q._id));
          return [...prev, ...fresh];
        });
      }
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to retrieve questions.');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, chapter, search, selectedClass, examType, qType, difficulty, concept, limit]);

  // Refetch page 1 when any filter modifications occur
  useEffect(() => {
    setPage(1);
    fetchQuestions(1);
  }, [selectedSubject, chapter, selectedClass, examType, qType, difficulty, concept, fetchQuestions]);

  // Refetch next page when infinite scroll page increments
  useEffect(() => {
    if (page > 1) {
      fetchQuestions(page);
    }
  }, [page, fetchQuestions]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && page < pages) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.1 });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading, page, pages]);

  // Handle Class Lock/Unlock
  const toggleClassLock = () => {
    if (!selectedClass) return;
    setIsClassLocked(!isClassLocked);
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    setSelectedClass(val);
    setChapter('');
    setConcept('');
    if (val) {
      setIsClassLocked(true); // Automatically lock on selection
    } else {
      setIsClassLocked(false);
    }
  };

  // Interactive Concept click inside question cards or filters
  const handleConceptTap = async (cName) => {
    if (!cName) return;
    setLoading(true);
    try {
      const res = await api.get('/teachers/concepts-count', {
        params: { concept: cName, subject: selectedSubject }
      });
      setActiveConceptInfo({
        name: cName,
        count: res.data.count
      });
      setConcept(cName);
      setChapter(''); // Clear chapter to show all questions for this concept under the subject
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClass('');
    setIsClassLocked(false);
    setChapter('');
    setConcept('');
    setExamType('');
    setQType('');
    setDifficulty('');
    setActiveConceptInfo(null);
    if (subject === 'All') {
      setSelectedSubject('Physics');
    }
    setPage(1);
  };

  const toggleRevealAnswer = (qId) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* Subject Header Board */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 sm:p-8 rounded-2xl border border-slate-700/50 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-widest">
              <BookOpen className="w-4 h-4" />
              <span>Assigned Subject Bank</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              {subject === 'All' ? 'All Subjects' : subject} Question Bank
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              {subject === 'All' 
                ? 'Access granted to the complete question database across all subjects.' 
                : `Access is limited to ${subject} curriculum materials. All views and restricted action attempts are monitored.`}
            </p>
          </div>
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/50 text-right min-w-[120px]">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Matches</span>
            <span className="text-2xl font-black text-brand-400 font-mono">{total}</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Search Keywords and Class Select */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Search Keywords
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search text in questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-9 pr-4 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider flex justify-between items-center">
              <span>NCERT Class</span>
              {selectedClass && (
                <button 
                  onClick={toggleClassLock}
                  className="text-[10px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-0.5"
                  title={isClassLocked ? "Unlock selection" : "Lock selection"}
                >
                  {isClassLocked ? <Lock className="w-3 h-3 text-red-500" /> : <Unlock className="w-3 h-3 text-emerald-500" />}
                  {isClassLocked ? "Locked" : "Lock"}
                </button>
              )}
            </label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              disabled={isClassLocked}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <option value="">Select Class (Unlocked)</option>
              <option value="11th">Class 11th (NCERT)</option>
              <option value="12th">Class 12th (NCERT)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Subject & Chapter Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Subject Select */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setChapter('');
                setConcept('');
              }}
              disabled={subject !== 'All'}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-500"
            >
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
            </select>
          </div>

          {/* Chapter Select */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Chapter
            </label>
            <select
              value={chapter}
              onChange={(e) => {
                setChapter(e.target.value);
                setConcept('');
              }}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer"
            >
              <option value="">All Chapters</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Concept Select */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Concept
            </label>
            <select
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer"
            >
              <option value="">All Concepts</option>
              {selectedClass && concepts.map((con) => {
                const count = conceptCounts[con] || 0;
                return (
                  <option key={con} value={con}>
                    {con} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
              {!selectedClass && questions.length > 0 && 
                Array.from(new Set(questions.map(q => q.concept).filter(Boolean))).map(con => (
                  <option key={con} value={con}>{con}</option>
                ))
              }
            </select>
          </div>

        </div>

        {/* Data Tag Filters (Exam Type, Difficulty Level, Question Type) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Exam Target
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer"
            >
              <option value="">All Exams</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Assessment Type
            </label>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer"
            >
              <option value="">All Formats</option>
              <option value="Multiple Choice">Multiple Choice (MCQ)</option>
              <option value="Numerical">Numerical Assessment</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 dark:text-white cursor-pointer"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-350 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-750"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reset All Filters</span>
            </button>
          </div>

        </div>

      </div>

      {/* Interactive Concept Banner */}
      {activeConceptInfo && (
        <div className="p-4 bg-brand-50/50 dark:bg-brand-950/15 text-brand-700 dark:text-brand-350 rounded-xl border border-brand-100 dark:border-brand-900/30 flex justify-between items-center text-sm">
          <div>
            Active Concept: <span className="font-extrabold">{activeConceptInfo.name}</span>
            <span className="ml-2 px-2 py-0.5 bg-brand-100 dark:bg-brand-900/50 rounded-lg text-xs font-mono font-black">{activeConceptInfo.count} questions available</span>
          </div>
          <button 
            onClick={() => {
              setActiveConceptInfo(null);
              setConcept('');
            }}
            className="text-xs font-extrabold hover:underline"
          >
            Clear Concept
          </button>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Library List (Infinite Scroll) */}
      <div className="space-y-6">
        {questions.length === 0 && !loading ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Questions Found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Try adjusting your keyword query or choosing a different NCERT class/chapter filter combination.
            </p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isAnswerRevealed = !!revealedAnswers[q._id];
            const isNumerical = q.question_type === 'Numerical' || (q.options && q.options.length === 0);

            return (
              <div 
                key={q._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden"
              >
                
                {/* Meta Information Tags */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {q.chapter}
                    </span>
                    {q.class && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20">
                        Class {q.class}
                      </span>
                    )}
                    {q.exam_type && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/20">
                        {q.exam_type}
                      </span>
                    )}
                    {q.question_type && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
                        {q.question_type}
                      </span>
                    )}
                    {q.difficulty_level && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        q.difficulty_level === 'Easy' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20' :
                        q.difficulty_level === 'Hard' ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/20' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-655 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {q.difficulty_level}
                      </span>
                    )}
                    {q.concept && (
                      <button 
                        onClick={() => handleConceptTap(q.concept)}
                        className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/20 hover:bg-teal-100 text-[10px] font-bold text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/20 cursor-pointer transition-all"
                        title="Click to filter by this concept"
                      >
                        Concept: {q.concept}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    ID: {q._id.substring(0, 8)}
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-4">
                  <div className="text-base font-bold text-slate-950 dark:text-slate-100 leading-relaxed">
                    <span className="text-brand-650 dark:text-brand-400 mr-1.5">Q{idx + 1}.</span>
                    <MathJaxRenderer content={q.question} className="inline-block" />
                  </div>

                  {/* Main Question Image diagram */}
                  {q.image_url && (
                    <div className="my-4 max-w-lg overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner bg-white">
                      <img 
                        src={q.image_url} 
                        alt="Question diagram" 
                        className="max-h-80 w-auto object-contain mx-auto" 
                      />
                    </div>
                  )}

                  {/* MCQ Options with potential option images */}
                  {!isNumerical && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {q.options.map((opt, oIdx) => {
                        const optImg = q.option_images && q.option_images[oIdx];
                        return (
                          <div 
                            key={oIdx}
                            className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-sm font-semibold transition-all flex flex-col gap-2"
                          >
                            <MathJaxRenderer content={opt} className="w-full text-slate-700 dark:text-slate-350" />
                            {optImg && (
                              <div className="max-w-xs mt-1.5 rounded overflow-hidden border border-slate-200 bg-white">
                                <img src={optImg} alt={`Option ${String.fromCharCode(65 + oIdx)}`} className="max-h-24 w-auto object-contain mx-auto" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer Drawer */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => toggleRevealAnswer(q._id)}
                        className="flex items-center gap-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:text-brand-500"
                      >
                        {isAnswerRevealed ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span>Hide Detailed Solution</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>Show Detailed Solution</span>
                          </>
                        )}
                      </button>

                      {isAnswerRevealed && (
                        <div className="animate-slide-in px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-extrabold border border-emerald-100 dark:border-emerald-900/30">
                          {isNumerical ? `Correct Answer: ${q.answer}` : `Correct Option: ${q.answer}`}
                        </div>
                      )}
                    </div>

                    {/* Detailed Solution Area */}
                    {isAnswerRevealed && (q.detailed_solution || q.solution_image_url) && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 animate-fade-in space-y-3">
                        <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Explanation / Solution:</span>
                        {q.detailed_solution && (
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                            <MathJaxRenderer content={q.detailed_solution} />
                          </div>
                        )}
                        {q.solution_image_url && (
                          <div className="max-w-lg mt-2 rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img src={q.solution_image_url} alt="Solution Diagram" className="max-h-60 w-auto object-contain mx-auto" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}

        {/* Infinite Scroll Loader element */}
        <div ref={loaderRef} className="py-8 text-center flex justify-center items-center">
          {loading && (
            <div className="flex gap-1.5 items-center text-slate-400 text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-bounce delay-100"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-bounce delay-200"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-bounce delay-300"></span>
              <span>Loading more questions...</span>
            </div>
          )}
          {!loading && page >= pages && questions.length > 0 && (
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">End of question library</span>
          )}
        </div>
      </div>

    </div>
  );
}
