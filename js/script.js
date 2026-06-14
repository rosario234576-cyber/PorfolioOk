const storiesCarousel = document.getElementById("storiesCarousel");
const storyPrev = document.getElementById("storyPrev");
const storyNext = document.getElementById("storyNext");

if (storiesCarousel && storyPrev && storyNext) {
  const scrollAmount = 320;

  storyNext.addEventListener("click", () => {
    storiesCarousel.scrollBy({
      left: scrollAmount,
      behavior: "smooth"
    });
  });

  storyPrev.addEventListener("click", () => {
    storiesCarousel.scrollBy({
      left: -scrollAmount,
      behavior: "smooth"
    });
  });
}