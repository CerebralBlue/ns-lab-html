document.addEventListener("DOMContentLoaded", () => {
  const submitButton = document.querySelector('#final-submit');
  // disable to submit button at first
  submitButton.disabled = true;
  const userInput = document.getElementById("user-input");
  const nameInput = document.getElementById("name-input");

  const quizzes = document.querySelectorAll('.quiz');
  
  quizzes.forEach((quiz) => {
    let form = quiz.querySelector('form');
    let fieldset = form.querySelector('fieldset');
    let section = quiz.querySelector('section');
    let checkButton = form.querySelector('.quiz-button');
    // change the oringinal "submit" button text to "Check"
    checkButton.textContent = "Check";
    
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      let selectedAnswers = form.querySelectorAll('input[name="answer"]:checked');
      let correctAnswers = fieldset.querySelectorAll('input[name="answer"][correct]');
      
      let is_correct = selectedAnswers.length === correctAnswers.length;
      for (let i = 0; i < selectedAnswers.length; i++) {
        if (!selectedAnswers[i].hasAttribute('correct')) {
          is_correct = false;
          break;
        }
      }
      
      if (is_correct) {
        section.classList.remove('hidden');
        resetFieldset(fieldset);
        
        // mark all fields with colors (for correct answers)
        const allAnswers = fieldset.querySelectorAll('input[name="answer"]');
        for (let i = 0; i < allAnswers.length; i++) {
          if (allAnswers[i].hasAttribute('correct')) {
            allAnswers[i].parentElement.classList.add('correct');
          } else {
            allAnswers[i].parentElement.classList.add('wrong');
          }
        }
      } else {
        section.classList.add('hidden');
        resetFieldset(fieldset);
        
        // mark wrong fields with colors
        for (let i = 0; i < selectedAnswers.length; i++) {
          if (!selectedAnswers[i].hasAttribute('correct')) {
            selectedAnswers[i].parentElement.classList.add('wrong');
          } else {
            selectedAnswers[i].parentElement.classList.add('correct');
          }
        }
      }
      
      // check if all quizzes are answered correctly
      checkAllQuizzesCorrect();
    });
  });

  // Function to reset the fieldset by removing the 'wrong' and 'correct' classes
  function resetFieldset(fieldset) {
    const fieldsetChildren = fieldset.children;
    for (let i = 0; i < fieldsetChildren.length; i++) {
      fieldsetChildren[i].classList.remove('wrong');
      fieldsetChildren[i].classList.remove('correct');
    }
  }

  // Function to check if all quizzes have been answered correctly
  function checkAllQuizzesCorrect() {
    let allCorrect = true;

    // Loop through each quiz to check if they are all correct
    quizzes.forEach((quiz) => {
      let form = quiz.querySelector('form');
      let selectedAnswers = form.querySelectorAll('input[name="answer"]:checked');
      let fieldset = quiz.querySelector('fieldset');
      let correctAnswers = fieldset.querySelectorAll('input[name="answer"][correct]');
      
      let is_correct = selectedAnswers.length === correctAnswers.length;
      for (let i = 0; i < selectedAnswers.length; i++) {
        if (!selectedAnswers[i].hasAttribute('correct')) {
          is_correct = false;
          break;
        }
      }

      if (!is_correct) {
        allCorrect = false;
      }
    });

    // Enable the submit button if all answers are correct
    // enter Email
    if (allCorrect) {
      submitButton.disabled = false;
      submitButton.addEventListener("click", function(event) {
        event.preventDefault();

        const inputText = userInput.value.trim();
        const nameText = nameInput.value.trim();

        if (inputText === "" & nameText === "") {
          alert("Please enter a valid name and email before submitting.");
        }
        else {
          //console.log(inputText);
          // call neuralseek function
          sendtoNeuralSeek(inputText, nameText);
          userInput.value = "";
          nameInput.value = "";
        }
      });
    } else {
      submitButton.disabled = true;
    }

    // Enable the submit button if all answers are correct
    // enter Name
    //if (allCorrect) {
    //  submitButton.disabled = false;
    //  submitButton.addEventListener("click", function(event) {
    //    event.preventDefault();

      //  const nameText = nameInput.value.trim();

        //if (nameText === "") {
          //alert("Please enter your full name.");
        //}
        //else {
          //console.log(inputText);
          // call neuralseek function
          //sendtoNeuralSeek(nameText);
          //nameInput.value = "";
        //}
      //});
    //} else {
    //  submitButton.disabled = true;
    //}
  }

  // send users email to NeuralSeek
  // may need to change url/embedcode to a production instance?
  function sendtoNeuralSeek(inputText, nameText) {
    const apiURL = 'https://api-usw.neuralseek.com/v1/511ac1dd124ebcfc5e42d108/mAIstro'; //'https://stagingapi.neuralseek.com/v1/jfrantz_testing_mAIstro/mAIstro';
    const embedcode = '1115148838'; //'2099133463'
    const data = {
      agent: "labs_certification-v2", //change to v3 if Certifer is approved
      params: [{
        name: "email",
        value: inputText
      },
      {
        name: "name",
        value: nameText
      }],
    };
    const requestOptions = {
      method: 'POST',
      headers: {
        'embedcode': embedcode,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(data),
    };

    fetch(apiURL, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response error');
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
});
