const stack = document.querySelector(".stack");
const cards = Array.from(stack.children)
  .reverse()
  .filter((child) => child.classList.contains("card"));

cards.forEach((card) => stack.appendChild(card));

let swipeStartX = null;
let swipeEndX = null;

stack.addEventListener("touchstart", (e) => {
  swipeStartX = e.touches[0].clientX;
});

stack.addEventListener("touchend", (e) => {
  swipeEndX = e.changedTouches[0].clientX;

  if (swipeStartX !== null && swipeEndX !== null) {
    if (swipeStartX - swipeEndX > 50) {
      moveCard();
    }

    swipeStartX = null;
    swipeEndX = null;
  }
});

stack.addEventListener("click", function (e) {
  const card = e.target.closest(".card");
  if (card && card === stack.lastElementChild) {
    card.classList.toggle("flipped");
  }
});

function moveCard() {
  const lastCard = stack.lastElementChild;
  if (lastCard.classList.contains("card")) {
    lastCard.classList.add("swap");

    setTimeout(() => {
      lastCard.classList.remove("swap");
      stack.insertBefore(lastCard, stack.firstElementChild);
    }, 1200);
  }
}
