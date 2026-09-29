
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const browseBtn = document.getElementById("browseBtn");
const parseBtn = document.getElementById("parseBtn");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");

let selectedFile = null;
let parsedData = null;

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// Open file picker
browseBtn.addEventListener("click", () => {
    fileInput.click();
});

dropzone.addEventListener("click", (event) => {
    if (event.target !== browseBtn) {
        fileInput.click();
    }
});

// Handle selected file
fileInput.addEventListener("change", () => {
    setFile(fileInput.files[0]);
});

function setFile(file) {
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["pdf", "docx", "txt"].includes(extension)) {
        alert("Please upload a PDF, DOCX or TXT file.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("File size must be below 10 MB.");
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileInfo.hidden = false;
    parseBtn.disabled = false;
    document.getElementById("results").hidden = true;
}

// Remove selected file
document.getElementById("removeBtn").addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.hidden = true;
    parseBtn.disabled = true;
});

// Drag and drop
["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        dropzone.classList.add("dragover");
    });
});

["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
        event.preventDefault();
        dropzone.classList.remove("dragover");
    });
});

dropzone.addEventListener("drop", event => {
    setFile(event.dataTransfer.files[0]);
});

// Extract text from PDF, DOCX or TXT
async function extractText(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "txt") {
        return await file.text();
    }

    const buffer = await file.arrayBuffer();

    if (extension === "pdf") {
        const pdf = await pdfjsLib.getDocument({
            data: buffer
        }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            text += content.items
                .map(item => item.str)
                .join(" ") + "\n";
        }

        return text;
    }

    if (extension === "docx") {
        const result = await mammoth.extractRawText({
            arrayBuffer: buffer
        });

        return result.value;
    }

    throw new Error("Unsupported file format.");
}

// Skills database
const skillsDatabase = [
    "Python", "Java", "JavaScript", "C++", "C#",
    "SQL", "MySQL", "PostgreSQL", "MongoDB",
    "HTML", "CSS", "React", "Angular", "Node.js",
    "Express", "Flask", "Django", "PHP",
    "Power BI", "Tableau", "Excel",
    "Pandas", "NumPy", "Matplotlib",
    "Machine Learning", "Deep Learning",
    "TensorFlow", "PyTorch",
    "Data Analysis", "Data Visualization",
    "AWS", "Azure", "Docker", "Kubernetes",
    "Git", "GitHub", "Linux",
    "REST API", "Figma",
    "Communication", "Leadership",
    "Project Management"
];

// Parse resume text
function parseResume(text) {

    const email =
        text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";

    const phone =
        text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";

    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const sectionNames = [
        "summary",
        "objective",
        "experience",
        "work experience",
        "education",
        "skills",
        "technical skills",
        "projects",
        "certifications",
        "achievements",
        "internships"
    ];

    const name = lines.find(line =>
        line.length > 2 &&
        line.length < 65 &&
        !line.includes("@") &&
        !/resume|curriculum vitae|https?:\/\//i.test(line) &&
        !sectionNames.includes(line.toLowerCase().replace(/:$/, ""))
    ) || "Candidate";

    const skills = skillsDatabase.filter(skill => {
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(
            "(^|[^a-z0-9+#.])" + escaped + "([^a-z0-9+#.]|$)",
            "i"
        );
        return regex.test(text);
    });

    const locationMatch = text.match(
        /(?:Location|Address|City|Based in)\s*[:|-]\s*([^\n,;]{2,50}(?:,\s*[A-Za-z ]{2,30})?)/i
    );

    const sectionPatterns = [
        ["Summary", /(^|\n)\s*(summary|objective|profile)\s*:?\s*(\n|$)/i],
        ["Experience", /(^|\n)\s*(experience|work experience|employment)\s*:?\s*(\n|$)/i],
        ["Education", /(^|\n)\s*(education|academic)\s*:?\s*(\n|$)/i],
        ["Skills", /(^|\n)\s*(skills|technical skills)\s*:?\s*(\n|$)/i],
        ["Projects", /(^|\n)\s*projects\s*:?\s*(\n|$)/i],
        ["Certifications", /(^|\n)\s*(certifications|certificates)\s*:?\s*(\n|$)/i],
        ["Achievements", /(^|\n)\s*achievements\s*:?\s*(\n|$)/i],
        ["Internships", /(^|\n)\s*internships\s*:?\s*(\n|$)/i]
    ];

    const sections = sectionPatterns
        .filter(([name, pattern]) => pattern.test(text))
        .map(([name]) => name);

    return {
        name,
        email,
        phone,
        location: locationMatch?.[1]?.trim() || "",
        skills,
        sections,
        text
    };
}

// Display results
function displayResults(data) {

    parsedData = data;

    document.getElementById("candidateName").textContent = data.name;

    document.getElementById("initials").textContent =
        data.name.split(/\s+/)
            .slice(0, 2)
            .map(word => word[0])
            .join("")
            .toUpperCase();

    document.getElementById("candidateEmail").textContent =
        data.email || "Not found";

    document.getElementById("candidatePhone").textContent =
        data.phone || "Not found";

    document.getElementById("candidateLocation").textContent =
        data.location || "Not found";

    // Skills
    const skillsList = document.getElementById("skillsList");
    skillsList.innerHTML = "";

    if (data.skills.length === 0) {
        skillsList.textContent = "No matching skills detected.";
    }

    data.skills.forEach(skill => {
        const chip = document.createElement("span");
        chip.className = "skill-chip";
        chip.textContent = skill;
        skillsList.appendChild(chip);
    });

    // Sections
    const sectionsList = document.getElementById("sectionsList");
    sectionsList.innerHTML = "";

    if (data.sections.length === 0) {
        sectionsList.textContent = "No standard headings detected.";
    }

    data.sections.forEach(section => {
        const item = document.createElement("div");
        item.className = "section-item";
        item.innerHTML = "<span>✓</span>";
        item.appendChild(document.createTextNode(section));
        sectionsList.appendChild(item);
    });

    // Extracted text
    document.getElementById("rawText").textContent = data.text;

    document.getElementById("results").hidden = false;

    document.getElementById("results").scrollIntoView({
        behavior: "smooth"
    });
}

// Parse button
parseBtn.addEventListener("click", async () => {

    if (!selectedFile) return;

    parseBtn.disabled = true;
    parseBtn.textContent = "Parsing...";

    try {
        const text = await extractText(selectedFile);

        if (!text.trim()) {
            throw new Error(
                "No text found. This may be a scanned PDF."
            );
        }

        const data = parseResume(text);
        displayResults(data);

    } catch (error) {
        alert(error.message || "Unable to parse resume.");
    } finally {
        parseBtn.disabled = false;
        parseBtn.textContent = "Parse Resume →";
    }
});

// Toggle extracted text
document.getElementById("toggleText").addEventListener("click", event => {

    const textArea = document.getElementById("rawText");

    textArea.hidden = !textArea.hidden;

    event.target.textContent =
        textArea.hidden ? "Show Text" : "Hide Text";
});

// Export parsed data as JSON
document.getElementById("downloadBtn").addEventListener("click", () => {

    if (!parsedData) return;

    const output = {
        parsedAt: new Date().toISOString(),
        candidate: {
            name: parsedData.name,
            email: parsedData.email,
            phone: parsedData.phone,
            location: parsedData.location
        },
        skills: parsedData.skills,
        sections: parsedData.sections,
        extractedText: parsedData.text
    };

    const blob = new Blob(
        [JSON.stringify(output, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "parsed_resume.json";
    link.click();

    URL.revokeObjectURL(url);
});