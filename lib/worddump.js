var xmlrpc = require('xmlrpc')
  , url = require('url')


function Worddump(params) {
  if (!params.user || !params.url || !params.password) {
    throw new Error("Need to set user, url, and password.");
  }

  var wpUrl = parseUrl(params.url)
    , rpcMethod = null;

  if (wpUrl.secure)
    rpcMethod = xmlrpc.createSecureClient;
  else
    rpcMethod = xmlrpc.createClient;
  
  this.rpc = rpcMethod({host: wpUrl.host, port: wpUrl.port, path: wpUrl.path});
  this.blogId = params.blogId || 0;
  this.user = params.user;
  this.password = params.password;
  this.args = [this.blogId, this.user, this.password];
}

Worddump.prototype = { 
  getComments: function(postId, callback) {
    var args = this.args.concat([{post_id: postId, number: 1000}]) //prob not more than 1000 comments on anyone's site
    this.rpc.methodCall('wp.getComments', args, callback);
  },

  getPostIds: function(filter, callback) {
    if (typeof filter === 'function') {
      callback = filter;
      filter = {};
    }

    var args = this.args.concat([filter, ['post_id']])
    this.rpc.methodCall('wp.getPosts', args, function(err, posts) {
      if (err)
        return callback(err)
      else
        return callback(null, posts.map(function(p){return p.post_id}));
    })
  },

  getPost: function(postId, fields, callback) {
    if (typeof fields === 'function') {
      callback = fields;
      fields = ['post_title', 'post_date_gmt', 'post_name', 'post_author', 'link', 'terms', 'post_content'];
    }
    

    var args = this.args.concat([postId, fields])
    this.rpc.methodCall('wp.getPost', args, callback);
  },

  getUsers: function(callback) {
    var args = this.args.concat([{}, ['first_name', 'last_name', 'email', 'username', 'nickname', 'nicename', 'display_name']]);
    this.rpc.methodCall('wp.getUsers', args, callback);
  }
}


/*****************
* Exports
******************/

module.exports = Worddump;


/*****************
* Private Methods
******************/


function parseUrl(wpUrl) { //from node-wordpress
  var urlParts, secure;

  // allow URLs without a protocol
  if ( !(/\w+:\/\//.test( wpUrl ) ) ) {
    wpUrl = "http://" + wpUrl;
  }
  urlParts = url.parse( wpUrl );
  secure = urlParts.protocol === "https:";

  return {
    host: urlParts.hostname,
    port: urlParts.port || (secure ? 443 : 80),
    path: urlParts.path.replace( /\/+$/, "" ) + "/xmlrpc.php",
    secure: secure
  };
};


