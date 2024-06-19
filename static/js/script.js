// SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
// SPDX-License-Identifier: MIT

// some general DOM manipulation methods

$(document).ready(function () {
  $("#dataTable").DataTable({
    order: [[0, "desc"]]
  });
  $("#order-history-table").DataTable({
    order: [[1, "desc"]]
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".sidebar .nav-link").forEach(function (element) {
    // show or hide submenus
    element.addEventListener("click", function (e) {
      const nextEl = element.nextElementSibling;
      const parentEl = element.parentElement;

      if (nextEl) {
        e.preventDefault();
        const mycollapse = new bootstrap.Collapse(nextEl);

        if (nextEl.classList.contains("show")) {
          mycollapse.hide();
        } else {
          mycollapse.show();
          // find other submenus with class=show
          var openedSubmenu =
            parentEl.parentElement.querySelector(".submenu.show");
          // if it exists, then close all of them
          if (openedSubmenu) {
            new bootstrap.Collapse(openedSubmenu);
          }
        }
      }
    }); // addEventListener
  }); // forEach
});
// DOMContentLoaded  end

$("pre code").html(function (index, html) {
  return html.trim().replace(/^(.*)$/gm, '<span class="line">$1</span>');
});

(function () {
  var pre = document.getElementsByTagName("pre"),
    pl = pre.length;
  for (var i = 0; i < pl; i++) {
    pre[i].innerHTML =
      '<span class="line-number"></span>' +
      pre[i].innerHTML +
      '<span class="cl"></span>';
    var num = pre[i].innerHTML.split(/\n/).length;
    for (var j = 0; j < num; j++) {
      var lineNum = pre[i].getElementsByTagName("span")[0];
      lineNum.innerHTML += "<span>" + (j + 1) + "</span>";
    }
  }
})();

// TODO check if this is used
jQuery(function ($) {
  function AddReadMore() {
    //This limit you can set after how much characters you want to show Read More.
    var carLmt = 100;
    // Text to show when text is collapsed
    var readMoreTxt = " ...read more";
    // Text to show when text is expanded
    var readLessTxt = " read less";

    //Traverse all selectors with this class and manipulate HTML part to show Read More
    $(".add-read-more").each(function () {
      if ($(this).find(".first-section").length) {
        return;
      }

      var allstr = $(this).text();
      if (allstr.length > carLmt) {
        var firstSet = allstr.substring(0, carLmt);
        var secdHalf = allstr.substring(carLmt, allstr.length);
        var strtoadd =
          firstSet +
          "<span class='second-section'>" +
          secdHalf +
          "</span><span class='read-more'  title='Click to Show More'>" +
          readMoreTxt +
          "</span><span class='read-less' title='Click to Show Less'>" +
          readLessTxt +
          "</span>";
        $(this).html(strtoadd);
      }
    });

    //Read More and Read Less Click Event binding
    $(document).on("click", ".read-more,.read-less", function () {
      $(this)
        .closest(".add-read-more")
        .toggleClass("show-less-content show-more-content");
    });
  }

  AddReadMore();
});

function statusToText(status) {
  let value = "";
  switch (status) {
    case 1:
      value = "Created";
      break;
    case 2:
      value = "Started";
      break;
    case 3:
      value = "Paused";
      break;
    case 4:
      value = "Finished";
      break;
  }
  return value;
}

function createHtmlStatus(status) {
  // created
  let value = '<div class="card-header bg-info">';
  switch (status) {
    case 2: // started
      value = '<div class="card-header bg-warning">';
      break;
    case 3: // paused
      value = '<div class="card-header bg-secondary">';
      break;
    case 4: // finished
      value = '<div class="card-header bg-danger">';
      break;
  }
  return value;
}

function logLevelToText(logLevel) {
  let value = "";
  switch (logLevel) {
    case 10:
      value = "DEBUG";
      break;
    case 20:
      value = "INFO";
      break;
    case 30:
      value = "WARNING";
      break;
    case 40:
      value = "ERROR";
      break;
    case 50:
      value = "CRITICAL";
      break;
  }
  return value;
}
