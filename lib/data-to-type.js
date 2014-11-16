var dataToType = function(input) {
   if(/[0-9]*$/.test(input))
    return parseInt(input);
  return input;
};

module.exports = dataToType;