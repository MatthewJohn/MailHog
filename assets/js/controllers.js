var mailhogApp = angular.module('mailhogApp', []);

mailhogApp.controller('MailCtrl', function ($scope, $http, $sce) {
  $scope.cache = {};
  $scope.previewAllHeaders = false;

  $scope.eventsPending = [];

  $scope.refresh = function() {
    $http.get('/api/v1/messages').success(function(data) {
      $scope.messages = data;
    });
  }
  $scope.refresh();

  $scope.selectMessage = function(message) {
  	if($scope.cache[message.Id]) {
  		$scope.preview = $scope.cache[message.Id];
      reflow();
  	} else {
  		$scope.preview = message;
	  	$http.get('/api/v1/messages/' + message.Id).success(function(data) {
	  	  $scope.cache[message.Id] = data;
	      data.previewHTML = $sce.trustAsHtml($scope.getMessageHTML(data));
  		  $scope.preview = data;
  		  preview = $scope.cache[message.Id];
        reflow();
	    });
	}
  }

  $scope.toggleHeaders = function(val) {
    $scope.previewAllHeaders = val;
    var t = window.setInterval(function() {
      if(val) {
        if($('#hide-headers').length) {
          window.clearInterval(t);
          reflow();
        }
      } else {
        if($('#show-headers').length) {
          window.clearInterval(t);
          reflow();
        }
      }
    }, 10);
  }

  $scope.getMessagePlain = function(message) {
  	var part;

  	if(message.MIME) {
  		for(var p in message.MIME.Parts) {
        if("Content-Type" in message.MIME.Parts[p].Headers) {
          if(message.MIME.Parts[p].Headers["Content-Type"].length > 0) {
      			if(message.MIME.Parts[p].Headers["Content-Type"][0].match(/text\/plain;?.*/)) {
      				part = message.MIME.Parts[p];
      				break;
      			}
          }
        }
  		}
	}

	if(!part) part = message.Content;

	return part.Body;
  }
  $scope.getMessageHTML = function(message) {
  	var part;
  	
  	if(message.MIME) {
  		for(var p in message.MIME.Parts) {
        if("Content-Type" in message.MIME.Parts[p].Headers) {
          if(message.MIME.Parts[p].Headers["Content-Type"].length > 0) {
      			if(message.MIME.Parts[p].Headers["Content-Type"][0].match(/text\/html;?.*/)) {
      				part = message.MIME.Parts[p];
      				break;
      			}
          }
        }
  		}
	}

	if(!part) part = message.Content;

	return part.Body;
  }

  $scope.date = function(timestamp) {
  	return (new Date(timestamp)).toString();
  };

  $scope.deleteAll = function() {
  	$('#confirm-delete-all').modal('show');
  }

  $scope.releaseOne = function(message) {
    $scope.releasing = message;
    $('#release-one').modal('show');
  }
  $scope.confirmReleaseMessage = function() {
    $('#release-one').modal('hide');
    var message = $scope.releasing;
    $scope.releasing = null;

    $http.post('/api/v1/messages/' + message.Id + '/release', {
      email: $('#release-message-email').val(),
      host: $('#release-message-smtp-host').val(),
      port: $('#release-message-smtp-port').val(),
    }).success(function() {
      alert("Message released")
    }).error(function(e) {
      alert("Failed to release message: " + e)
    });
  }

  $scope.getSource = function(message) {
  	var source = "";
  	$.each(message.Content.Headers, function(k, v) {
  		source += k + ": " + v + "\n";
  	});
	source += "\n";
	source += message.Content.Body;
	return source;
  }

  $scope.deleteAllConfirm = function() {
  	$('#confirm-delete-all').modal('hide');
  	$http.post('/api/v1/messages/delete').success(function() {
  		$scope.refresh();
  		$scope.preview = null;
  	});
  }

  $scope.deleteOne = function(message) {
  	$http.post('/api/v1/messages/' + message.Id + '/delete').success(function() {
  		if($scope.preview._id == message._id) $scope.preview = null;
  		$scope.refresh();
  	});
  }
});