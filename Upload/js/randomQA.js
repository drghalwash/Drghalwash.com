// File: /public/js/randomQA.js

function initializeRandomQA(partialsPath) {
  const qaContainer = document.getElementById('qa-container');
  let currentIndex = -1;
  let interval;
  let qas = [];

  // Inline CSS for styling
  const style = document.createElement('style');
  style.innerHTML = `
    /* Search Bar */
    .search-container {
      width: 90%;
      margin: auto;
      padding: 10px;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: #f9f9f9;
      border-radius: 25px;
      padding: 10px;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    }
    .search-box input {
      flex: 1;
      border: none;
      outline: none;
      padding: 10px;
      border-radius: 25px;
    }
    .search-icon {
      margin-left: 10px;
    }

    /* Q&A Section */
    .qa-section {
      margin-top: 20px;
      padding: 20px;
    }
    .qa-row {
      opacity: 0;
      transition: opacity 1s ease-in-out;
    }
    .qa-row h3 {
      cursor: pointer;
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 5px;
    }
    .qa-row p {
      margin-top: 10px;
      display: none; /* Initially hidden */
    }
    .qa-row.active p {
      display: block; /* Show when active */
    }
    .special-text {
      color: #007bff;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  // Fetch all Q&A partials dynamically
  fetch(partialsPath)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract Q&A items
      qas = Array.from(doc.querySelectorAll('.accordion-item')).map((item) => ({
        question: item.querySelector('button').textContent,
        answer: item.querySelector('.accordion-body').innerHTML,
      }));

      updateQA(); // Initialize the first Q&A
      interval = setInterval(updateQA, 5000); // Auto-switch every 5 seconds
    });

  function updateQA() {
    if (qas.length === 0) return;

    currentIndex = (currentIndex + 1) % qas.length; // Cycle through Q&As
    const { question, answer } = qas[currentIndex];

    qaContainer.innerHTML = `
      <div class="qa-row" style="opacity: 0;">
        <h3>${question}</h3>
        <p>${answer}</p>
      </div>
    `;

    const qaRow = document.querySelector('.qa-row');
    
    setTimeout(() => (qaRow.style.opacity = '1'), 100); // Fade-in effect

    // Add click event to toggle visibility of the answer
    qaRow.querySelector('h3').addEventListener('click', () => {
      qaRow.classList.toggle('active'); // Toggle active state
    });
    
    // Stop auto-switching on hover or click
    qaRow.addEventListener('mouseenter', () => clearInterval(interval));
    qaRow.addEventListener('mouseleave', () => (interval = setInterval(updateQA, 5000)));
  }

}

// Search functionality
function handleSearch(term) {
  const qaContainer = document.getElementById('qa-container');
  
  term = term.toLowerCase();

  Array.from(qaContainer.children).forEach((child) => {
    const questionText = child.querySelector('h3')?.textContent.toLowerCase();
    
    if (questionText.includes(term)) {
      child.style.display = 'block';
    } else {
      child.style.display = 'none';
    }
  });
}
