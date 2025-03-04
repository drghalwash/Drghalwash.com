
const TAGS = [
    'Dr. Khaled Ghalwash', 'Dr. Mohammed Ghalwash', 'Alexandria, Egypt', 'Plastic Surgery',
    'Aesthetic Excellence', 'Patient Care', 'Professional Experience', 'Surgical Expertise',
    'Medical Innovation', 'Beauty Enhancement', 'Surgical Precision', 'Patient Safety'
];

function createTag(text) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = text;
    return tag;
}

function initializeTagCloud() {
    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;

    // Create three sets of tags for continuous scrolling
    for (let i = 0; i < 3; i++) {
        TAGS.forEach(tag => {
            tagRow.appendChild(createTag(tag));
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeTagCloud);
const TAGS = [
    'Dr. Khaled Ghalwash', 'Dr. Mohammed Ghalwash', 'Alexandria, Egypt',
    'Plastic Surgery', 'Aesthetic Excellence', 'Patient Care',
    'Professional Experience', 'Surgical Expertise', 'Medical Innovation',
    'Beauty Enhancement', 'Surgical Precision', 'Patient Safety'
];

function createTag(text) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = text;
    return tag;
}

function initializeTagCloud() {
    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;
    
    // Create two sets of tags for continuous scrolling
    for (let i = 0; i < 2; i++) {
        TAGS.forEach(tag => {
            tagRow.appendChild(createTag(tag));
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeTagCloud);
