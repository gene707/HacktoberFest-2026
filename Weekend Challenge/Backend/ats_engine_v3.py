
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

COMMON_SKILLS = [
    "python","java","c++","javascript","react","nodejs","docker",
    "kubernetes","aws","azure","gcp","sql","mysql","postgresql",
    "linux","git","terraform","flask","django","cybersecurity",
    "networking","wireshark","burpsuite","nmap"
]

def extract_skills(text):
    txt = text.lower()
    return sorted(list({s for s in COMMON_SKILLS if s in txt}))

def detect_seniority(text):
    txt = text.lower()
    if any(x in txt for x in ["senior","lead","principal","architect"]):
        return "Senior"
    if any(x in txt for x in ["mid","intermediate","3+ years","4+ years","5+ years"]):
        return "Mid-Level"
    return "Entry-Level"

def semantic_similarity(resume_text, job_description):
    emb1 = model.encode([resume_text])
    emb2 = model.encode([job_description])
    return round(float(cosine_similarity(emb1, emb2)[0][0]) * 100, 2)

def analyze_resume(resume_text, job_description):
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)

    matched = sorted(list(set(resume_skills) & set(job_skills)))
    missing = sorted(list(set(job_skills) - set(resume_skills)))

    similarity = semantic_similarity(resume_text, job_description)

    recommendations = []
    if missing:
        recommendations.append(
            f"Add missing skills: {', '.join(missing[:10])}"
        )

    if similarity < 60:
        recommendations.append(
            "Tailor project descriptions to match the job requirements."
        )

    if not recommendations:
        recommendations.append(
            "Resume is strongly aligned with the target role."
        )

    return {
        "ats_version": "v3",
        "semantic_similarity": similarity,
        "resume_seniority": detect_seniority(resume_text),
        "job_seniority": detect_seniority(job_description),
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendations": recommendations,
        "report": {
            "score": similarity,
            "skills_found": len(resume_skills),
            "skills_required": len(job_skills),
            "matched_count": len(matched),
            "missing_count": len(missing)
        }
    }
