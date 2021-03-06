const Project = require('../models/project');
const Deadline = require('../models/deadline');
const Resource = require('../models/resource');
const User = require('../models/user');
const helpers = require('./hash');

// Clean Array -
// Input - An array with unpredicted null values
// Returns - New array without null values
const cleanArray = async (actual) => {
  return new Promise((resolve, reject) => {
    const newArray = new Array();
    for (let i = 0; i < actual.length; i++) {
      if (actual[i]) {
        newArray.push(actual[i]);
      }
    }
    resolve(newArray);
  });
};

// fetchProject - Fetches a single project object with
// unresolved deadlines and resources
// Input - ID
// Output - Project Object
const fetchProject = async (projectID) => {
  return new Promise((resolve, reject) => {
    if (projectID != null) {
      // console.log(`Fetching Project: ${projectID}`);
      Project.findById(projectID, (err, project) => {
        resolve(project);
      });
    } else {
      console.error('Attempt to fetch a null object!');
      reject(obj);
    }
  });
};

// fetchAllUsers - Fetches all users associated with a
// project object
// Input - ID ( Project )
// Output - Array of User Objects
const fetchAllUsers = async () => {
  new Promise((resolve, reject) => {
    User.find({}, async (err, users) => {
      // console.log(`${users.length} users found!`);
      resolve(users);
    });
  });
};

// fetchProjectUsers - Fetches all users associated with a
// project object
// Input - ID ( Project )
// Output - Array of User Objects
const fetchProjectUsers = async (projectID) => {
  return new Promise((resolve, reject) => {
    const users = User.find({ projects: projectID });
    for (let i = 0; i < users.length; ++i) {
      users[i].password = '';
    }
    resolve(users);
  });
};

// fetchResource - Fetches all resources associated with a
// project object
// Input - ID ( Project )
// Output - Array of Resource Objects
const fetchResource = async (resourceID) => {
  return new Promise((resolve, reject) => {
    if (resourceID != null) {
      // console.log(`Fetching Resource: ${resourceID}`);
      Resource.findById(resourceID, (err, resource) => {
        if (resource != null) {
          // console.log(resource);
          resolve(resource);
        } else {
          reject(resource);
        }
      });
    } else {
      console.error('Attempt to fetch a null object!');
      reject(resourceID);
    }
  });
};

// fetchDeadline - Fetches all resources associated with a
// project object
// Input - ID ( Project )
// Output - Array of Deadline Objects
const fetchDeadline = async (deadlineID) => {
  return new Promise((resolve, reject) => {
    if (deadlineID != null) {
      // console.log(`Fetching Deadline: ${deadlineID}`);
      Deadline.findById(deadlineID, (err, deadline) => {
        if (deadline != null) {
          // console.log('Deadline Found!');
          // console.log(deadline);
          resolve(deadline);
        } else {
          reject(deadline);
        }
      });
    } else {
      console.error('Attempt to fetch a null object!');
      reject(resourceID);
    }
  });
};

// Public functions
module.exports = {

/* Authentication Method (API)
Input:
* User Object (Username and Password decrypted from basic auth header)
* requiredAccess - Compares the current users access level with that required to
perform the action, this can be 'none' if anyone should be able to perform the action.

Output:
* If the user was found and has the correct access the user object is returned
* Otherwise it returns a specific error message which can be sent back to the client.
*/
  authenticateUser: async (user, requiredAccess) => {
    return new Promise((resolve, reject) => {
      // console.log(`Looking for: ${JSON.stringify(user)}`);
      // console.log(`Search Name: ${user.name}`);
      // console.log(`Search Password: ${helpers.hashCode(user.pass)}`);
      User.find({ username: user.name, password: helpers.hashCode(user.pass) }, (err, found) => {
        if (err || found[0] == null) {
          // console.log('Incorrect Password!');
          resolve({
            responseCode: 404, // 404 Response Code - User not found
            errorCode: 'Incorrect Password',
            // User friendly message
            errorMessage:
            'We did not recognise that username and password, please try again!',
          });
        } else if (found[0].type === requiredAccess || requiredAccess === 'none') {
          // console.log('User Found, Correct Access!');
          found[0].password = '';
          resolve(found[0]);
        } else {
          // console.log('User Found, Incorrect Access!');
          resolve({
            responseCode: 401, // 401 Response Code - Insufficient Access
            errorCode: 'Insufficient Privileges',
            errorMessage: "You don't have access to perform this action!",
          });
        }
      });
    });
  },

  /* Authentication Method (WEB)
Input:
* User ID (Which we associated with the users session)
* requiredAccess - Compares the current users access level with that required to
perform the action, this can be 'none' if anyone should be able to perform the action.

Output:
* If the user was found and has the correct access the user object is returned
* Otherwise it returns a specific error message which can be sent back to the client.
*/
  authenticateWebUser: async (user, requiredAccess) => {
    return new Promise((resolve, reject) => {
      // //console.log(`Looking for: ${JSON.stringify(user)}`);
      // Search against the ID
      User.find({ _id: user.userID }, (err, found) => {
        // Not Found -
        if (err || found[0] == null) {
          // //console.log('UserID Not Found!');
          resolve({
            responseCode: 401,
            errorCode: 'Incorrect Session ID',
            errorMessage:
              'We did not recognise that session ID, please try again!',
          });
        }
        if (found[0].type === requiredAccess || requiredAccess === 'none') {
        //  //console.log('User Found, Correct Access!');
          resolve(found[0]);
        } else {
        //  //console.log('User Found, Incorrect Access!');
          resolve({
            responseCode: 401,
            errorCode: 'Insufficient Privileges',
            errorMessage: "You don't have access to perform this action!",
          });
        }
      });
    });
  },

  /* getProject
  Input:
  * Project ID
  Output:
  * A complete object containing all of a projects users, deadlines and resources.
  Note:
  * Uses private functions fetchProject/fetchResource/fetchDeadline
  to fetch and combine all these objects.
  */
  getProject: async (objID) => {
    const resourceObjs = []; // Holds this projects Resources
    const deadlineObjs = []; // Hold this projects Deadlines
    const project = {}; // Holds this project
    // console.log('GetProject Called!');
    // console.log('Input: ');
    // //console.log(objID);
    if (objID != null) {
      project.record = await fetchProject(objID).catch((err) => {
        // console.log(err);
      });
      /* Fetch Resource Records */
      if (project.record.resources != null) {
        for (let j = 0; j < project.record.resources.length; ++j) {
          resourceObjs[j] = await fetchResource(project.record.resources[j]).catch((err) => {
            // console.log(err);
          });
        }
        /* Clean Resource Records */
        project.resourceObjects = await cleanArray(resourceObjs);
      }
      /* Fetch Deadline Records */
      if (project.record.deadlines != null) {
        for (let j = 0; j < project.record.deadlines.length; ++j) {
          deadlineObjs[j] = await fetchDeadline(project.record.deadlines[j]).catch((err) => {
            // console.log(err);
          });
        }
        /* Clean Deadline Records */
        project.deadlineObjects = await cleanArray(deadlineObjs);
      }
      /* Fetch User Records */
      project.users = await fetchProjectUsers(project.record._id);

      return project;
    }
    return ({
      responseCode: 404, // 404 Response Code - User not found
      errorCode: 'Invalid ID',
      // User friendly message
      errorMessage:
         'We did not recognise that project ID, please try again!',
    });
  },

  /* getUserList */
  // Returns a list of all users in the system
  getUserList: async () => {
    const userList = await fetchAllUsers();
    return userList;
  },


  /* addProjectToUser */
  // Adds a reference to a new project to a User object
  addProjectToUser: async (userID, projectID) => {
    return new Promise((resolve, reject) => {
      // Find a matching user
      User.find({ _id: userID }, (err, found) => {
        if (err || found[0] == null) {
          resolve({
            responseCode: 404, // 404 Response Code - User not found
            errorCode: 'Incorrect Password',
            // User friendly message
            errorMessage:
             'We did not recognise that username and password, please try again!',
          });
        } else {
          // Check if the projects field is null
          if (found[0].projects == null) {
            found[0].projects = [];
          }
          // Push the new project to the users projects array.
          found[0].projects.push(projectID);
          found[0].save((err, updatedProject) => {
            if (err) {
              resolve(err);
            }
            resolve(updatedProject);
          });
        }
      });
    });
  },
  /* removeProjectFromUser */
  // Removes a reference of a project to a User object
  // Usually in deletion of a project
  removeProjectFromUser: async (userID, projectID) => {
    return new Promise((resolve, reject) => {
      User.find({ _id: userID }, (err, found) => {
        if (err || found[0] == null) {
          resolve({
            responseCode: 404, // 404 Response Code - User not found
            errorCode: 'Incorrect Password',
            // User friendly message
            errorMessage:
             'We did not recognise that username and password, please try again!',
          });
        } else {
          // If its a null value, set it to an array
          if (found[0].projects == null) {
            found[0].projects = [];
          }

          for (let i = 0; i < found[0].projects.length; i++) {
            // If the project exists, remove it from the array
            if (found[0].projects[i] == projectID) {
              found[0].projects.splice(i, 1);
              break;
            }
          }
          found[0].save((err, updatedProject) => {
            if (err) {
              resolve(err);
            }
            resolve(updatedProject);
          });
        }
      });
    });
  },

  /* removeProjectFromAllUsers */
  // Removes a reference of a project from all User Objects
  // Usually in deletion of a project
  removeProjectFromAllUsers: async (projectID) => {
    return new Promise((resolve, reject) => {
      User.find({ projects: projectID }, (err, found) => {
        if (err || found[0] == null) {
          resolve({
            responseCode: 404, // 404 Response Code - User not found
            errorCode: 'No Matching Users Found!',
            // User friendly message
            errorMessage:
             'We did not find any users associated with that project!',
          });
        } else {
          // Iterate over Users
          for (let i = 0; i < found.length; ++i) {
            // If its a null value, set it to an array
            if (found[i].projects == null) {
              found[i].projects = [];
            }
            // Iterate over this User's Projects
            for (let j = 0; j < found[i].projects.length; j++) {
              if (found[i].projects[j].equals(projectID)) {
                found[i].projects.splice(j, 1);
              }
            }

            found[i].save((err, updatedProject) => {
              if (err) {
                resolve(err);
              } else {
              }
            });
          }
          resolve(found);
        }
      });
    });
  },

};
