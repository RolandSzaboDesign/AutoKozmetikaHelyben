const forint = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

module.exports = { forint };
