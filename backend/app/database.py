import datetime
import uuid
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("uvicorn.error")

client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.get_database("secure_question_bank")

questions_db = client.get_database("MANCHESTER_QUESTIONS")

# Collections
teachers_col = db.get_collection("teachers")
questions_col = questions_db.get_collection("jee_questions")
sessions_col = db.get_collection("sessions")
audit_logs_col = db.get_collection("audit_logs")
otps_col = db.get_collection("otps")

async def seed_database():
    logger.info("Initializing database seeding...")
    
    # 1. Seed Teachers
    default_teachers = [
        # Teachers who can view everything
        {"email": "tarunmallu2005@gmail.com", "subject": "All", "role": "teacher", "is_active": True},
        {"email": "sampathkumarcm87@gmail.com", "subject": "All", "role": "teacher", "is_active": True},
        {"email": "roopesh041204@gmail.com", "subject": "All", "role": "teacher", "is_active": True},
        # Physics
        {"email": "shrishass85@gmail.com", "subject": "Physics", "role": "teacher", "is_active": True},
        {"email": "sreddy07@gmail.com", "subject": "Physics", "role": "teacher", "is_active": True},
        # Chemistry
        {"email": "vasanthshetty66@gmail.com", "subject": "Chemistry", "role": "teacher", "is_active": True},
        {"email": "ramachandrareddy2005@gmail.com", "subject": "Chemistry", "role": "teacher", "is_active": True},
        # Maths
        {"email": "sun03736@gmail.com", "subject": "Mathematics", "role": "teacher", "is_active": True},
        # Biology
        {"email": "sunilduttjoshi93@gmail.com", "subject": "Biology", "role": "teacher", "is_active": True},
        # Admin
        {"email": "admin@manchester.com", "subject": "All", "role": "admin", "is_active": True},
        {"email": "manchestertechnologiess@gmail.com", "subject": "All", "role": "admin", "is_active": True}
    ]
    
    for teacher in default_teachers:
        email_lower = teacher["email"].lower()
        existing = await teachers_col.find_one({"email": email_lower})
        if not existing:
            teacher_doc = {
                "_id": str(uuid.uuid4()),
                "email": email_lower,
                "subject": teacher["subject"],
                "role": teacher["role"],
                "is_active": teacher["is_active"],
                "created_at": datetime.datetime.utcnow().isoformat() + "Z"
            }
            await teachers_col.insert_one(teacher_doc)
            logger.info(f"Seeded teacher: {teacher['email']}")
        else:
            await teachers_col.update_one(
                {"email": email_lower},
                {"$set": {
                    "subject": teacher["subject"],
                    "role": teacher["role"],
                    "is_active": teacher["is_active"]
                }}
            )
            logger.info(f"Updated teacher permissions: {teacher['email']} -> {teacher['subject']}")

    # 2. Seed Sample Questions
    sample_questions = [
        # Physics
        {
            "subject": "Physics",
            "chapter": "Quantum Mechanics",
            "question": "Which of the following equations correctly expresses the time-dependent Schrödinger equation for a single particle in one dimension? Also calculate the probability density of finding the particle.",
            "options": [
                "A. $$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(x,t) = -\\frac{\\hbar^2}{2m}\\frac{\\partial^2}{\\partial x^2}\\Psi(x,t) + V(x,t)\\Psi(x,t)$$",
                "B. $$H\\Psi = E\\Psi$$",
                "C. $$E = mc^2$$",
                "D. $$\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}$$"
            ],
            "answer": "A",
            "image_url": ""
        },
        {
            "subject": "Physics",
            "chapter": "Electromagnetism",
            "question": "Identify Maxwell's equation representing Faraday's law of induction in differential form.",
            "options": [
                "A. $$\\nabla \\cdot \\vec{D} = \\rho$$",
                "B. $$\\nabla \\cdot \\vec{B} = 0$$",
                "C. $$\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}$$",
                "D. $$\\nabla \\times \\vec{H} = \\vec{J} + \\frac{\\partial \\vec{D}}{\\partial t}$$"
            ],
            "answer": "C",
            "image_url": ""
        },
        {
            "subject": "Physics",
            "chapter": "Relativity",
            "question": "The relativistic factor $\\gamma$ (gamma) is defined by which formula?",
            "options": [
                "A. $$\\gamma = \\sqrt{1 - \\frac{v^2}{c^2}}$$",
                "B. $$\\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}$$",
                "C. $$\\gamma = 1 + \\frac{v^2}{c^2}$$",
                "D. $$\\gamma = \\frac{mc^2}{\\sqrt{1 - v^2}}$$"
            ],
            "answer": "B",
            "image_url": ""
        },
        # Chemistry
        {
            "subject": "Chemistry",
            "chapter": "Organic Chemistry",
            "question": "Identify the primary product formed when benzene undergoes Friedel-Crafts alkylation with methyl chloride in the presence of anhydrous aluminium chloride ($AlCl_3$).",
            "options": [
                "A. Chlorobenzene ($C_6H_5Cl$)",
                "B. Toluene ($C_6H_5CH_3$)",
                "C. Phenol ($C_6H_5OH$)",
                "D. Nitrobenzene ($C_6H_5NO_2$)"
            ],
            "answer": "B",
            "image_url": ""
        },
        {
            "subject": "Chemistry",
            "chapter": "Chemical Kinetics",
            "question": "What is the Arrhenius equation that represents the temperature dependence of reaction rates?",
            "options": [
                "A. $$k = Ae^{-\\frac{E_a}{RT}}$$",
                "B. $$PV = nRT$$",
                "C. $$\\Delta G = \\Delta H - T\\Delta S$$",
                "D. $$pH = pK_a + \\log\\frac{[A^-]}{[HA]}$$"
            ],
            "answer": "A",
            "image_url": ""
        },
        # Mathematics
        {
            "subject": "Mathematics",
            "chapter": "Calculus",
            "question": "Compute the definite integral: $$\\int_0^\\pi \\sin^2(x) dx$$",
            "options": [
                "A. $$\\pi$$",
                "B. $$\\frac{\\pi}{2}$$",
                "C. $$\\frac{\\pi}{4}$$",
                "D. $$2\\pi$$"
            ],
            "answer": "B",
            "image_url": ""
        },
        {
            "subject": "Mathematics",
            "chapter": "Algebra",
            "question": "What are the roots of the quadratic equation $ax^2 + bx + c = 0$?",
            "options": [
                "A. $$x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
                "B. $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$",
                "C. $$x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{2a}$$",
                "D. $$x = -b \\pm \\sqrt{b^2 - 4ac}$$"
            ],
            "answer": "B",
            "image_url": ""
        },
        # Biology
        {
            "subject": "Biology",
            "chapter": "Cellular Biology",
            "question": "Which organelle is primarily responsible for ATP synthesis in eukaryotic cells?",
            "options": [
                "A. Nucleus",
                "B. Golgi Apparatus",
                "C. Mitochondrion",
                "D. Lysosome"
            ],
            "answer": "C",
            "image_url": ""
        },
        {
            "subject": "Biology",
            "chapter": "Genetics",
            "question": "Which nitrogenous base is found in RNA but NOT in DNA?",
            "options": [
                "A. Adenine",
                "B. Cytosine",
                "C. Uracil",
                "D. Thymine"
            ],
            "answer": "C",
            "image_url": ""
        }
    ]
    
    # Ensure sample questions exist (even if collection is not empty)
    for q in sample_questions:
        existing_q = await questions_col.find_one({"question": q["question"]})
        if not existing_q:
            q_doc = {
                "_id": str(uuid.uuid4()),
                "subject": q["subject"],
                "chapter": q["chapter"],
                "question": q["question"],
                "options": q["options"],
                "answer": q["answer"],
                "image_url": q["image_url"]
            }
            await questions_col.insert_one(q_doc)
            logger.info(f"Seeded missing sample question for subject: {q['subject']}")
    logger.info("Questions seeding check complete.")
