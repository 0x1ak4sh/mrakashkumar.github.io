 jQuery(document).ready(function() {
      $('form').submit(function(event) {
        event.preventDefault();
        var formData = $(this).serialize();
        $.ajax({
          type: 'POST',
          url: 'https://mrakashkumar.000webhostapp.com/send_email.php',
          data: formData,
          success: function(response) {
            console.log(response);
          }
        });
      });
    });
