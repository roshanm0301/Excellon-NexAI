export const regEx = {
  pattern:
    /^\{[$][.][^\}]*\}|^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  patternForPath:
    /^[a-zA-Z]+|^\{[$][.][^\}]*\}|^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  validString: /^[a-zA-Z]*$/,
  stringWithSpace: /^[a-zA-Z ]*$/,
  stringWithSpecialCharacter: /^(?!\d+$)(?:[a-zA-Z][a-zA-Z .!@&$#$]*)?$/,
  stringWithNumber: /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/,
  mobileNumber: /^[7-9][0-9]{9}$/,
  emailId: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/,
  pluralString: /^[a-zA-Z](.*)s$/,
  validDomain: /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/,
  validIP: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  validDate: /^\d{2}[./-]\d{2}[./-]\d{4}$/,
  password: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/,
  validName: /^[A-Za-z]+[A-Za-z]$/,
  userName: /^[a-zA-Z0-9.]+$/,
  number:/^[0-9]*$/,
  stringWithLowercaseCharacter: /^[a-za-z]*$/,
};


