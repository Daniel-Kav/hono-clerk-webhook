const form = document.getElementById('form');
const firstname = document.getElementById('first_name');
const lastname = document.getElementById('last_name');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirm_password = document.getElementById('confrim_password');
 //prevent form submission on default values
form.addEventListener('submit',e =>{
    e.preventDefault();

    validateInputs();
});
const validateInputs = ()=>{
    const firstnameValue = firstname.value.trim();
    const lastnameValue = lastname.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const confirm_passwordValue = confirm_password.value.trim();
}