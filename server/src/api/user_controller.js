const {ObjectId} = require("mongodb");
const UsersDAO = require("../dao/usersDAO");
const {wrapTryCatch} = require("../utils/promise_utils");

class UsersController {
  static async apiGetCurrentUser(req, res, next) {
    const {user} = req;

    const projection = {"username": 1, "fullName": 1,"wishlists._id": 1};
    const [results, err] = await wrapTryCatch(UsersDAO.getCurrentUser({_id: new ObjectId(user._id)}, projection));

    if(err) return res.status(500).json({status: "failed", errors: err});

    if(!results || results.length === 0) {
      return res.status(404).json({status: "failed"});
    }

    const [current] = results;

    return res.status(200).json({status: "success", user: current});
  }

  static async apiGetCurrentUserWishlist(req, res, next) {
    const {user} = req;

    const [results, err] = await wrapTryCatch(
      UsersDAO.getCurrentUser(
        {_id: new ObjectId(user._id)},
        {
          "wishlists.summary": 0,
          "wishlists.platforms": 0,
          "wishlists.screenshots": 0,
        }
      )
    );

    if(err) return res.status(500).json({status: "failed"});

    if(!results || results.length === 0) return res.status(404).json({status: "failed"});

    const [{wishlists}] = results;

    return res.status(200).json({status: "success", wishlists});
  }
}

module.exports = UsersController;