
let data = [
  { year: 2020, people: { family: 5, schoolFriends: 10, universityFriends: 0 } },
  { year: 2021, people: { family: 3, schoolFriends: 15, universityFriends: 5 } },
  { year: 2022, people: { family: 3, schoolFriends: 20, universityFriends: 10 } },
  { year: 2023, people: { family: 3, schoolFriends: 20, universityFriends: 15 } },
  { year: 2024, people: { family: 2, schoolFriends: 10, universityFriends: 10 } }
];

// Colores por categoría
let colors = {
  family: "#007BFF",
  schoolFriends: "#FF00FF",
  universityFriends: "#00CC66" 
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  background(255);

  let spacing = width / (data.length + 1); // space between balloons
  let y = height / 2; // centrados verticalmente

  data.forEach((birthday, i) => {
    let x = spacing * (i + 1);
    drawBalloon(x, y, birthday);
  });
}

function drawBalloon(x, y, birthday) {
  let balloonW = width / 6; 
  let balloonH = height / 3;

  // Balloon
  stroke(0);
  fill(255);
  ellipse(x, y, balloonW, balloonH);

  // Year
  fill(0);
  textAlign(CENTER);
  textSize(25); 
  text(birthday.year, x, y - balloonH / 2 - 15);

  // Rope
  line(x, y + balloonH / 2, x, y + balloonH);

  // People
  for (let type in birthday.people) {
    let count = birthday.people[type];
    fill(colors[type]);
    noStroke();
    for (let i = 0; i < count; i++) {
      let px = x + random(-balloonW / 3, balloonW / 3);
      let py = y + random(-balloonH / 3, balloonH / 3);
      ellipse(px, py, 15, 15); 
    }
  }
}
