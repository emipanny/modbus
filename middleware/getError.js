
exports._ = controller => (req, res) => controller(req, res).catch(err => {
	console.log(err);
    res.render('error', {
        message: err.message,
        error: err
    });
});
