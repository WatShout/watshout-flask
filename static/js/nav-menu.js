window.onload = function() {
    // w3schools dropdown for nav menu
    var navImport = document.getElementById("import-doc").import;
    var navContent = navImport.getElementById("nav-container");
    var clone = document.importNode(navContent, true);
    document.getElementById('nav-wrapper').appendChild(clone);
    var dropdown = document.getElementById("nav-toggle");
    dropdown.addEventListener("click", function() {
        var runnerDivs = document.getElementsByClassName("all-runners");
        for (var i = 0; i < runnerDivs.length; i++) {
            runnerDivs[i].classList.toggle("down-shift");
        }
        var dropdownContent = document.getElementsByClassName("nav-menu")[0];
        if (dropdownContent.style.display === "table") {
            dropdownContent.style.display = "none";
        } else {
            dropdownContent.style.display = "table";
        }
    });
    //turns entire nav row into link
    jQuery(document).ready(function($) {
        $(".nav-menu-row").click(function() {
            window.location = $(this).data("href");
        });
    });
};