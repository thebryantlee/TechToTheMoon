window.addEventListener("load", getRecentNews);

function getRecentNews() {
  const newsLocation = document.getElementById("insertRecentNewsHere");
  newsLocation.innerHTML =
    '<div class="p-4 p-md-5 mb-4 text-dark rounded bg-white">' +
    '<div class="col-md-6 px-0">' +
    '<h1 class="display-4 fst-italic" id="primaryRecentNewsTitle">Title of a longer featured blog post</h1>' +
    '<p class="lead my-3" id="primaryRecentNewsSample">Multiple lines of text that form the lede, informing new readers quickly and efficiently about what’s most interesting in this post’s contents.</p>' +
    '<p class="lead mb-0"><a href="#" class="text-primary fw-bold" id="primaryRecentNewsLink">Continue reading &#8811;</a></p>' +
    "</div>" +
    "</div>";
  newsLocation.innerHTML +=
    '<div class="row mb-2">' +
    '<div class="col-md-6">' +
    '<div class="row g-0 border-dark rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">' +
    '<div class="col p-4 d-flex flex-column position-static bg-dark">' +
    '<strong class="d-inline-block mb-2 text-primary" id="secondaryNews1Category" >World</strong>' +
    '<h3 class="mb-0" id="secondaryNews1Title">Featured post</h3>' +
    '<div class="mb-1 text-muted" id="secondaryNews1Datetime">Nov 12</div>' +
    '<p class="card-text mb-auto" id="secondaryNews1Sample">This is a wider card with supporting text below as a natural lead-in to additional content.</p>' +
    '<a href="#" class="stretched-link text-primary fw-semibold" id="secondaryNews1Link">Continue reading &#8811;</a>' +
    "</div>" +
    '<div class="col-auto d-none d-lg-block">' +
    '<svg class="bd-placeholder-img" width="200" height="250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">Thumbnail</text></svg>' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="col-md-6">' +
    '<div class="row g-0 border-dark rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative">' +
    '<div class="col p-4 d-flex flex-column position-static bg-dark">' +
    '<strong class="d-inline-block mb-2 text-primary" id="secondaryNews2Category">Design</strong>' +
    '<h3 class="mb-0" id="secondaryNews2Title">Post title</h3>' +
    '<div class="mb-1 text-muted" id="secondaryNews2Datetime">Nov 11</div>' +
    '<p class="mb-auto" id="secondaryNews2Sample">This is a wider card with supporting text below as a natural lead-in to additional content.</p>' +
    '<a href="#" class="stretched-link text-primary fw-semibold" id="secondaryNews2Link">Continue reading &#8811;</a>' +
    "</div>" +
    '<div class="col-auto d-none d-lg-block">' +
    '<svg class="bd-placeholder-img" width="200" height="250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">Thumbnail</text></svg>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>";

  var xhr = new XMLHttpRequest();
  xhr.open("GET", `/recent_news`, true);

  xhr.onload = function () {
    if (this.status == 200) {
      const response = JSON.parse(this.responseText);

      const primaryTitle = document.getElementById("primaryRecentNewsTitle");
      const primarySample = document.getElementById("primaryRecentNewsSample");
      const primaryLink = document.getElementById("primaryRecentNewsLink");
      primaryTitle.innerHTML = response[0].title;
      primarySample.innerHTML = getSampleText(response[0].full_article);
      primaryLink.setAttribute("href", "/article/featured/0");

      const secondary1Category = document.getElementById(
        "secondaryNews1Category"
      );
      const secondary1Title = document.getElementById("secondaryNews1Title");
      const secondary1Datetime = document.getElementById(
        "secondaryNews1Datetime"
      );
      const secondary1Sample = document.getElementById("secondaryNews1Sample");
      const secondary1Link = document.getElementById("secondaryNews1Link");
      secondary1Category.innerHTML = getCategory(response[1].category);
      secondary1Title.innerHTML = response[1].title;
      const date1 = new Date(response[1].post_datetime).toDateString();
      secondary1Datetime.innerHTML = date1;
      secondary1Sample.innerHTML = getSampleText(response[1].full_article);
      secondary1Link.setAttribute("href", "/article/featured/1");

      const secondary2Category = document.getElementById(
        "secondaryNews2Category"
      );
      const secondary2Title = document.getElementById("secondaryNews2Title");
      const secondary2Datetime = document.getElementById(
        "secondaryNews2Datetime"
      );
      const secondary2Sample = document.getElementById("secondaryNews2Sample");
      const secondary2Link = document.getElementById("secondaryNews2Link");
      secondary2Category.innerHTML = getCategory(response[2].category);
      secondary2Title.innerHTML = response[2].title;
      const date2 = new Date(response[2].post_datetime).toDateString();
      secondary2Datetime.innerHTML = date2;
      secondary2Sample.innerHTML = getSampleText(response[2].full_article);
      secondary2Link.setAttribute("href", "/article/featured/2");
    }
  };

  xhr.send();
}

function getSampleText(text) {
  var output = text.slice(0, 200);
  if (output.length == 200) {
    output = output + "...";
  }
  return output;
}

function getCategory(num) {
  switch (num) {
    case 0:
      return error;
    case 1:
      return "New Release";
    case 2:
      return "Tech Company";
    case 3:
      return "Major Update";
    case 4:
      return "Event";
    case 5:
      return "Random";
  }
}
