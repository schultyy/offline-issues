'use strict';

(function() {
  function repoName() {
    return $('#repositoryName').val().toString();
  }

  function renderListView() {
    var repo = repoName();
    if(!repo || repo === "") {
      return;
    }
    var db = new PouchDB(repo);
    db.allDocs({ include_docs: true })
      .then(function(docs) {
        $(".issue-list").empty();
        var plainDocs = _.map(docs.rows, function(d) { return d.doc; });
        var views = _.map(plainDocs, renderIssueView);
        $(".issue-list").append(views);
      });

    function renderIssueView(issue) {
      var container = $("<a href='#' class='list-group-item'>");
      var heading = $("<h4 class='list-group-item-heading'></h4>")
      container.attr('id', issue.id);
      heading.html(issue.title);
      container.append(heading);
      container.click(showIssueDetail);
      return container;
    }

    function showIssueDetail(ev) {
      var id = $(this).attr('id');
      var db = new PouchDB(repoName());
      db.get(id)
        .then(function(issue) {
          var container = $('.issue-detail');
          var backButton = $("<button>Back</button>");
          backButton.click(hideIssueDetails);
          container.append(backButton);

          var title = $("<h4>"+ issue.title +"</h4>");
          var text = $("<p>" + issue.body + "</p>");
          container.append(title);
          container.append(text);
          $(container).show();
          $(".issue-list").hide();
        })
        .catch(function(err) {
          console.log("ERR", err);
        });
    }

    function hideIssueDetails() {
      $(".issue-list").show();
      $(".issue-detail").hide();
      $(".issue-detail").empty();
    }
  }

  function fetchIssues(ev) {
    ev.preventDefault();
    var repo = repoName();
    if(!repo || repo === "") {
      return;
    }

    var gh = new GitHub();
    var issueHandle = gh.getIssues(repo);
    issueHandle.listIssues({}, function(_none, issues) {
      var db = new PouchDB(repo);
      db.bulkDocs(_.map(issues, setDocId))
      .then(function() {
          renderListView();
      })
      .catch(function(err){
        console.log("ERR", err);
      });
    });

    function setDocId(issue) {
      issue['_id'] = issue.id.toString();
      return issue;
    }
  }

  $(document).ready(function() {
    $('.fetch-issues').click(fetchIssues);
    renderListView();
  });
})();