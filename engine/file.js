// file.js
// resposnsible for loading the resources for the application

// loads the resources for the application
// path: the path to the resource
function loadFile(path)
{
    if (path == null) {
        console.log("Path is null");
        return;
    }
    // the path needs to be formatted like ./
    // add the ./ if it is not there
    if (path[0] != '.') {
        path = "./" + path;
    }

    if (g_USE_FETCH) {
        return loadFileFetch(path);
    }

    // check the g_static dictionary
    if (g_static[path] != undefined) {
        return g_static[path];
    }

    // not found, return an error
    console.log("Resource not found: " + path);
    return null;
}

// loads a file using fetch
// path: the path to the resource
async function loadFileFetch(path)
{
    // add a ./ to go back to the root directory
    path = "./" + path;
    let resource = await fetch(path);
    if (!resource.ok) {
        console.log("Resource not found: " + path);
        return null;
    }

    let content = resource.text();
    return content;
}