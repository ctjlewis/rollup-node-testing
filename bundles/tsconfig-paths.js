import path from 'path';
import fs from 'fs';
import module from 'module';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var filesystem = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });

function fileExistsSync(path) {
    try {
        var stats = fs.statSync(path);
        return stats.isFile();
    }
    catch (err) {
        // If error, assume file did not exist
        return false;
    }
}
exports.fileExistsSync = fileExistsSync;
/**
 * Reads package.json from disk
 * @param file Path to package.json
 */
// tslint:disable-next-line:no-any
function readJsonFromDiskSync(packageJsonPath) {
    if (!fs.existsSync(packageJsonPath)) {
        return undefined;
    }
    return commonjsRequire();
}
exports.readJsonFromDiskSync = readJsonFromDiskSync;
function readJsonFromDiskAsync(path, 
// tslint:disable-next-line:no-any
callback) {
    fs.readFile(path, "utf8", function (err, result) {
        // If error, assume file did not exist
        if (err || !result) {
            return callback();
        }
        var json = JSON.parse(result);
        return callback(undefined, json);
    });
}
exports.readJsonFromDiskAsync = readJsonFromDiskAsync;
function fileExistsAsync(path2, callback2) {
    fs.stat(path2, function (err, stats) {
        if (err) {
            // If error assume file does not exist
            return callback2(undefined, false);
        }
        callback2(undefined, stats ? stats.isFile() : false);
    });
}
exports.fileExistsAsync = fileExistsAsync;
function removeExtension(path) {
    return path.substring(0, path.lastIndexOf(".")) || path;
}
exports.removeExtension = removeExtension;
});

var mappingEntry = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * Converts an absolute baseUrl and paths to an array of absolute mapping entries.
 * The array is sorted by longest prefix.
 * Having an array with entries allows us to keep a sorting order rather than
 * sort by keys each time we use the mappings.
 * @param absoluteBaseUrl
 * @param paths
 * @param addMatchAll
 */
function getAbsoluteMappingEntries(absoluteBaseUrl, paths, addMatchAll) {
    // Resolve all paths to absolute form once here, and sort them by
    // longest prefix once here, this saves time on each request later.
    // We need to put them in an array to preseve the sorting order.
    var sortedKeys = sortByLongestPrefix(Object.keys(paths));
    var absolutePaths = [];
    for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
        var key = sortedKeys_1[_i];
        absolutePaths.push({
            pattern: key,
            paths: paths[key].map(function (pathToResolve) {
                return path.join(absoluteBaseUrl, pathToResolve);
            })
        });
    }
    // If there is no match-all path specified in the paths section of tsconfig, then try to match
    // all paths relative to baseUrl, this is how typescript works.
    if (!paths["*"] && addMatchAll) {
        absolutePaths.push({
            pattern: "*",
            paths: [absoluteBaseUrl.replace(/\/$/, "") + "/*"]
        });
    }
    return absolutePaths;
}
exports.getAbsoluteMappingEntries = getAbsoluteMappingEntries;
/**
 * Sort path patterns.
 * If a module name can be matched with multiple patterns then pattern with the longest prefix will be picked.
 */
function sortByLongestPrefix(arr) {
    return arr
        .concat()
        .sort(function (a, b) { return getPrefixLength(b) - getPrefixLength(a); });
}
function getPrefixLength(pattern) {
    var prefixLength = pattern.indexOf("*");
    return pattern.substr(0, prefixLength).length;
}
});

var tryPath = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });

var path_1 = path;

/**
 * Builds a list of all physical paths to try by:
 * 1. Check for file named exactly as request.
 * 2. Check for files named as request ending in any of the extensions.
 * 3. Check for file specified in package.json's main property.
 * 4. Check for files named as request ending in "index" with any of the extensions.
 */
function getPathsToTry(extensions, absolutePathMappings, requestedModule) {
    if (!absolutePathMappings ||
        !requestedModule ||
        requestedModule[0] === "." ||
        requestedModule[0] === path.sep) {
        return undefined;
    }
    var pathsToTry = [];
    for (var _i = 0, absolutePathMappings_1 = absolutePathMappings; _i < absolutePathMappings_1.length; _i++) {
        var entry = absolutePathMappings_1[_i];
        var starMatch = entry.pattern === requestedModule
            ? ""
            : matchStar(entry.pattern, requestedModule);
        if (starMatch !== undefined) {
            var _loop_1 = function (physicalPathPattern) {
                var physicalPath = physicalPathPattern.replace("*", starMatch);
                pathsToTry.push({ type: "file", path: physicalPath });
                pathsToTry.push.apply(pathsToTry, extensions.map(function (e) { return ({ type: "extension", path: physicalPath + e }); }));
                pathsToTry.push({
                    type: "package",
                    path: path.join(physicalPath, "/package.json")
                });
                var indexPath = path.join(physicalPath, "/index");
                pathsToTry.push.apply(pathsToTry, extensions.map(function (e) { return ({ type: "index", path: indexPath + e }); }));
            };
            for (var _a = 0, _b = entry.paths; _a < _b.length; _a++) {
                var physicalPathPattern = _b[_a];
                _loop_1(physicalPathPattern);
            }
        }
    }
    return pathsToTry.length === 0 ? undefined : pathsToTry;
}
exports.getPathsToTry = getPathsToTry;
// Not sure why we don't just return the full found path?
function getStrippedPath(tryPath) {
    return tryPath.type === "index"
        ? path_1.dirname(tryPath.path)
        : tryPath.type === "file"
            ? tryPath.path
            : tryPath.type === "extension"
                ? filesystem.removeExtension(tryPath.path)
                : tryPath.type === "package"
                    ? tryPath.path
                    : exhaustiveTypeException(tryPath.type);
}
exports.getStrippedPath = getStrippedPath;
function exhaustiveTypeException(check) {
    throw new Error("Unknown type " + check);
}
exports.exhaustiveTypeException = exhaustiveTypeException;
/**
 * Matches pattern with a single star against search.
 * Star must match at least one character to be considered a match.
 * @param patttern for example "foo*"
 * @param search for example "fooawesomebar"
 * @returns the part of search that * matches, or undefined if no match.
 */
function matchStar(pattern, search) {
    if (search.length < pattern.length) {
        return undefined;
    }
    if (pattern === "*") {
        return search;
    }
    var star = pattern.indexOf("*");
    if (star === -1) {
        return undefined;
    }
    var part1 = pattern.substring(0, star);
    var part2 = pattern.substring(star + 1);
    if (search.substr(0, star) !== part1) {
        return undefined;
    }
    if (search.substr(search.length - part2.length) !== part2) {
        return undefined;
    }
    return search.substr(star, search.length - part2.length);
}
});

var matchPathSync = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });




/**
 * Creates a function that can resolve paths according to tsconfig paths property.
 * @param absoluteBaseUrl Absolute version of baseUrl as specified in tsconfig.
 * @param paths The paths as specified in tsconfig.
 * @param mainFields A list of package.json field names to try when resolving module files.
 * @param addMatchAll Add a match-all "*" rule if none is present
 * @returns a function that can resolve paths.
 */
function createMatchPath(absoluteBaseUrl, paths, mainFields, addMatchAll) {
    if (mainFields === void 0) { mainFields = ["main"]; }
    if (addMatchAll === void 0) { addMatchAll = true; }
    var absolutePaths = mappingEntry.getAbsoluteMappingEntries(absoluteBaseUrl, paths, addMatchAll);
    return function (requestedModule, readJson, fileExists, extensions) {
        return matchFromAbsolutePaths(absolutePaths, requestedModule, readJson, fileExists, extensions, mainFields);
    };
}
exports.createMatchPath = createMatchPath;
/**
 * Finds a path from tsconfig that matches a module load request.
 * @param absolutePathMappings The paths to try as specified in tsconfig but resolved to absolute form.
 * @param requestedModule The required module name.
 * @param readJson Function that can read json from a path (useful for testing).
 * @param fileExists Function that checks for existance of a file at a path (useful for testing).
 * @param extensions File extensions to probe for (useful for testing).
 * @param mainFields A list of package.json field names to try when resolving module files.
 * @returns the found path, or undefined if no path was found.
 */
function matchFromAbsolutePaths(absolutePathMappings, requestedModule, readJson, fileExists, extensions, mainFields) {
    if (readJson === void 0) { readJson = filesystem.readJsonFromDiskSync; }
    if (fileExists === void 0) { fileExists = filesystem.fileExistsSync; }
    if (extensions === void 0) { extensions = Object.keys(commonjsRequire.extensions); }
    if (mainFields === void 0) { mainFields = ["main"]; }
    var tryPaths = tryPath.getPathsToTry(extensions, absolutePathMappings, requestedModule);
    if (!tryPaths) {
        return undefined;
    }
    return findFirstExistingPath(tryPaths, readJson, fileExists, mainFields);
}
exports.matchFromAbsolutePaths = matchFromAbsolutePaths;
function findFirstExistingMainFieldMappedFile(packageJson, mainFields, packageJsonPath, fileExists) {
    for (var index = 0; index < mainFields.length; index++) {
        var mainFieldName = mainFields[index];
        var candidateMapping = packageJson[mainFieldName];
        if (candidateMapping && typeof candidateMapping === "string") {
            var candidateFilePath = path.join(path.dirname(packageJsonPath), candidateMapping);
            if (fileExists(candidateFilePath)) {
                return candidateFilePath;
            }
        }
    }
    return undefined;
}
function findFirstExistingPath(tryPaths, readJson, fileExists, mainFields) {
    if (readJson === void 0) { readJson = filesystem.readJsonFromDiskSync; }
    if (mainFields === void 0) { mainFields = ["main"]; }
    for (var _i = 0, tryPaths_1 = tryPaths; _i < tryPaths_1.length; _i++) {
        var tryPath$1 = tryPaths_1[_i];
        if (tryPath$1.type === "file" ||
            tryPath$1.type === "extension" ||
            tryPath$1.type === "index") {
            if (fileExists(tryPath$1.path)) {
                // Not sure why we don't just return the full path? Why strip it?
                return tryPath.getStrippedPath(tryPath$1);
            }
        }
        else if (tryPath$1.type === "package") {
            var packageJson = readJson(tryPath$1.path);
            if (packageJson) {
                var mainFieldMappedFile = findFirstExistingMainFieldMappedFile(packageJson, mainFields, tryPath$1.path, fileExists);
                if (mainFieldMappedFile) {
                    // Not sure why we don't just return the full path? Why strip it?
                    return filesystem.removeExtension(mainFieldMappedFile);
                }
            }
        }
        else {
            tryPath.exhaustiveTypeException(tryPath$1.type);
        }
    }
    return undefined;
}
});

var matchPathAsync = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });




/**
 * See the sync version for docs.
 */
function createMatchPathAsync(absoluteBaseUrl, paths, mainFields, addMatchAll) {
    if (mainFields === void 0) { mainFields = ["main"]; }
    if (addMatchAll === void 0) { addMatchAll = true; }
    var absolutePaths = mappingEntry.getAbsoluteMappingEntries(absoluteBaseUrl, paths, addMatchAll);
    return function (requestedModule, readJson, fileExists, extensions, callback) {
        return matchFromAbsolutePathsAsync(absolutePaths, requestedModule, readJson, fileExists, extensions, callback, mainFields);
    };
}
exports.createMatchPathAsync = createMatchPathAsync;
/**
 * See the sync version for docs.
 */
function matchFromAbsolutePathsAsync(absolutePathMappings, requestedModule, readJson, fileExists, extensions, callback, mainFields) {
    if (readJson === void 0) { readJson = filesystem.readJsonFromDiskAsync; }
    if (fileExists === void 0) { fileExists = filesystem.fileExistsAsync; }
    if (extensions === void 0) { extensions = Object.keys(commonjsRequire.extensions); }
    if (mainFields === void 0) { mainFields = ["main"]; }
    var tryPaths = tryPath.getPathsToTry(extensions, absolutePathMappings, requestedModule);
    if (!tryPaths) {
        return callback();
    }
    findFirstExistingPath(tryPaths, readJson, fileExists, callback, 0, mainFields);
}
exports.matchFromAbsolutePathsAsync = matchFromAbsolutePathsAsync;
function findFirstExistingMainFieldMappedFile(packageJson, mainFields, packageJsonPath, fileExistsAsync, doneCallback, index) {
    if (index === void 0) { index = 0; }
    if (index >= mainFields.length) {
        return doneCallback(undefined, undefined);
    }
    var tryNext = function () {
        return findFirstExistingMainFieldMappedFile(packageJson, mainFields, packageJsonPath, fileExistsAsync, doneCallback, index + 1);
    };
    var mainFieldMapping = packageJson[mainFields[index]];
    if (typeof mainFieldMapping !== "string") {
        // Skip mappings that are not pointers to replacement files
        return tryNext();
    }
    var mappedFilePath = path.join(path.dirname(packageJsonPath), mainFieldMapping);
    fileExistsAsync(mappedFilePath, function (err, exists) {
        if (err) {
            return doneCallback(err);
        }
        if (exists) {
            return doneCallback(undefined, mappedFilePath);
        }
        return tryNext();
    });
}
// Recursive loop to probe for physical files
function findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index, mainFields) {
    if (index === void 0) { index = 0; }
    if (mainFields === void 0) { mainFields = ["main"]; }
    var tryPath$1 = tryPaths[index];
    if (tryPath$1.type === "file" ||
        tryPath$1.type === "extension" ||
        tryPath$1.type === "index") {
        fileExists(tryPath$1.path, function (err, exists) {
            if (err) {
                return doneCallback(err);
            }
            if (exists) {
                // Not sure why we don't just return the full path? Why strip it?
                return doneCallback(undefined, tryPath.getStrippedPath(tryPath$1));
            }
            if (index === tryPaths.length - 1) {
                return doneCallback();
            }
            // Continue with the next path
            return findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index + 1, mainFields);
        });
    }
    else if (tryPath$1.type === "package") {
        readJson(tryPath$1.path, function (err, packageJson) {
            if (err) {
                return doneCallback(err);
            }
            if (packageJson) {
                return findFirstExistingMainFieldMappedFile(packageJson, mainFields, tryPath$1.path, fileExists, function (mainFieldErr, mainFieldMappedFile) {
                    if (mainFieldErr) {
                        return doneCallback(mainFieldErr);
                    }
                    if (mainFieldMappedFile) {
                        // Not sure why we don't just return the full path? Why strip it?
                        return doneCallback(undefined, filesystem.removeExtension(mainFieldMappedFile));
                    }
                    // No field in package json was a valid option. Continue with the next path.
                    return findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index + 1, mainFields);
                });
            }
            // This is async code, we need to return unconditionally, otherwise the code still falls
            // through and keeps recursing. While this might work in general, libraries that use neo-async
            // like Webpack will actually not allow you to call the same callback twice.
            //
            // An example of where this caused issues:
            // https://github.com/dividab/tsconfig-paths-webpack-plugin/issues/11
            //
            // Continue with the next path
            return findFirstExistingPath(tryPaths, readJson, fileExists, doneCallback, index + 1, mainFields);
        });
    }
    else {
        tryPath.exhaustiveTypeException(tryPath$1.type);
    }
}
});

var unicode = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,"__esModule",{value:true});var Space_Separator=exports.Space_Separator=/[\u1680\u2000-\u200A\u202F\u205F\u3000]/;var ID_Start=exports.ID_Start=/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/;var ID_Continue=exports.ID_Continue=/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
});

var util = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,'__esModule',{value:true});exports.isSpaceSeparator=isSpaceSeparator;exports.isIdStartChar=isIdStartChar;exports.isIdContinueChar=isIdContinueChar;exports.isDigit=isDigit;exports.isHexDigit=isHexDigit;var unicode$1=_interopRequireWildcard(unicode);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else {var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key];}}newObj.default=obj;return newObj}}function isSpaceSeparator(c){return unicode$1.Space_Separator.test(c)}function isIdStartChar(c){return c>='a'&&c<='z'||c>='A'&&c<='Z'||c==='$'||c==='_'||unicode$1.ID_Start.test(c)}function isIdContinueChar(c){return c>='a'&&c<='z'||c>='A'&&c<='Z'||c>='0'&&c<='9'||c==='$'||c==='_'||c==='\u200C'||c==='\u200D'||unicode$1.ID_Continue.test(c)}function isDigit(c){return /[0-9]/.test(c)}function isHexDigit(c){return /[0-9A-Fa-f]/.test(c)}
});

var parse_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,'__esModule',{value:true});var _typeof=typeof Symbol==='function'&&typeof Symbol.iterator==='symbol'?function(obj){return typeof obj}:function(obj){return obj&&typeof Symbol==='function'&&obj.constructor===Symbol&&obj!==Symbol.prototype?'symbol':typeof obj};exports.default=parse;var util$1=_interopRequireWildcard(util);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else {var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key];}}newObj.default=obj;return newObj}}var source=void 0;var parseState=void 0;var stack=void 0;var pos=void 0;var line=void 0;var column=void 0;var token=void 0;var key=void 0;var root=void 0;function parse(text,reviver){source=String(text);parseState='start';stack=[];pos=0;line=1;column=0;token=undefined;key=undefined;root=undefined;do{token=lex();parseStates[parseState]();}while(token.type!=='eof');if(typeof reviver==='function'){return internalize({'':root},'',reviver)}return root}function internalize(holder,name,reviver){var value=holder[name];if(value!=null&&(typeof value==='undefined'?'undefined':_typeof(value))==='object'){for(var _key in value){var replacement=internalize(value,_key,reviver);if(replacement===undefined){delete value[_key];}else {value[_key]=replacement;}}}return reviver.call(holder,name,value)}var lexState=void 0;var buffer=void 0;var doubleQuote=void 0;var _sign=void 0;var c=void 0;function lex(){lexState='default';buffer='';doubleQuote=false;_sign=1;for(;;){c=peek();var _token=lexStates[lexState]();if(_token){return _token}}}function peek(){if(source[pos]){return String.fromCodePoint(source.codePointAt(pos))}}function read(){var c=peek();if(c==='\n'){line++;column=0;}else if(c){column+=c.length;}else {column++;}if(c){pos+=c.length;}return c}var lexStates={default:function _default(){switch(c){case'\t':case'\x0B':case'\f':case' ':case'\xA0':case'\uFEFF':case'\n':case'\r':case'\u2028':case'\u2029':read();return;case'/':read();lexState='comment';return;case undefined:read();return newToken('eof');}if(util$1.isSpaceSeparator(c)){read();return}return lexStates[parseState]()},comment:function comment(){switch(c){case'*':read();lexState='multiLineComment';return;case'/':read();lexState='singleLineComment';return;}throw invalidChar(read())},multiLineComment:function multiLineComment(){switch(c){case'*':read();lexState='multiLineCommentAsterisk';return;case undefined:throw invalidChar(read());}read();},multiLineCommentAsterisk:function multiLineCommentAsterisk(){switch(c){case'*':read();return;case'/':read();lexState='default';return;case undefined:throw invalidChar(read());}read();lexState='multiLineComment';},singleLineComment:function singleLineComment(){switch(c){case'\n':case'\r':case'\u2028':case'\u2029':read();lexState='default';return;case undefined:read();return newToken('eof');}read();},value:function value(){switch(c){case'{':case'[':return newToken('punctuator',read());case'n':read();literal('ull');return newToken('null',null);case't':read();literal('rue');return newToken('boolean',true);case'f':read();literal('alse');return newToken('boolean',false);case'-':case'+':if(read()==='-'){_sign=-1;}lexState='sign';return;case'.':buffer=read();lexState='decimalPointLeading';return;case'0':buffer=read();lexState='zero';return;case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':buffer=read();lexState='decimalInteger';return;case'I':read();literal('nfinity');return newToken('numeric',Infinity);case'N':read();literal('aN');return newToken('numeric',NaN);case'"':case'\'':doubleQuote=read()==='"';buffer='';lexState='string';return;}throw invalidChar(read())},identifierNameStartEscape:function identifierNameStartEscape(){if(c!=='u'){throw invalidChar(read())}read();var u=unicodeEscape();switch(u){case'$':case'_':break;default:if(!util$1.isIdStartChar(u)){throw invalidIdentifier()}break;}buffer+=u;lexState='identifierName';},identifierName:function identifierName(){switch(c){case'$':case'_':case'\u200C':case'\u200D':buffer+=read();return;case'\\':read();lexState='identifierNameEscape';return;}if(util$1.isIdContinueChar(c)){buffer+=read();return}return newToken('identifier',buffer)},identifierNameEscape:function identifierNameEscape(){if(c!=='u'){throw invalidChar(read())}read();var u=unicodeEscape();switch(u){case'$':case'_':case'\u200C':case'\u200D':break;default:if(!util$1.isIdContinueChar(u)){throw invalidIdentifier()}break;}buffer+=u;lexState='identifierName';},sign:function sign(){switch(c){case'.':buffer=read();lexState='decimalPointLeading';return;case'0':buffer=read();lexState='zero';return;case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':buffer=read();lexState='decimalInteger';return;case'I':read();literal('nfinity');return newToken('numeric',_sign*Infinity);case'N':read();literal('aN');return newToken('numeric',NaN);}throw invalidChar(read())},zero:function zero(){switch(c){case'.':buffer+=read();lexState='decimalPoint';return;case'e':case'E':buffer+=read();lexState='decimalExponent';return;case'x':case'X':buffer+=read();lexState='hexadecimal';return;}return newToken('numeric',_sign*0)},decimalInteger:function decimalInteger(){switch(c){case'.':buffer+=read();lexState='decimalPoint';return;case'e':case'E':buffer+=read();lexState='decimalExponent';return;}if(util$1.isDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},decimalPointLeading:function decimalPointLeading(){if(util$1.isDigit(c)){buffer+=read();lexState='decimalFraction';return}throw invalidChar(read())},decimalPoint:function decimalPoint(){switch(c){case'e':case'E':buffer+=read();lexState='decimalExponent';return;}if(util$1.isDigit(c)){buffer+=read();lexState='decimalFraction';return}return newToken('numeric',_sign*Number(buffer))},decimalFraction:function decimalFraction(){switch(c){case'e':case'E':buffer+=read();lexState='decimalExponent';return;}if(util$1.isDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},decimalExponent:function decimalExponent(){switch(c){case'+':case'-':buffer+=read();lexState='decimalExponentSign';return;}if(util$1.isDigit(c)){buffer+=read();lexState='decimalExponentInteger';return}throw invalidChar(read())},decimalExponentSign:function decimalExponentSign(){if(util$1.isDigit(c)){buffer+=read();lexState='decimalExponentInteger';return}throw invalidChar(read())},decimalExponentInteger:function decimalExponentInteger(){if(util$1.isDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},hexadecimal:function hexadecimal(){if(util$1.isHexDigit(c)){buffer+=read();lexState='hexadecimalInteger';return}throw invalidChar(read())},hexadecimalInteger:function hexadecimalInteger(){if(util$1.isHexDigit(c)){buffer+=read();return}return newToken('numeric',_sign*Number(buffer))},string:function string(){switch(c){case'\\':read();buffer+=escape();return;case'"':if(doubleQuote){read();return newToken('string',buffer)}buffer+=read();return;case'\'':if(!doubleQuote){read();return newToken('string',buffer)}buffer+=read();return;case'\n':case'\r':throw invalidChar(read());case'\u2028':case'\u2029':separatorChar(c);break;case undefined:throw invalidChar(read());}buffer+=read();},start:function start(){switch(c){case'{':case'[':return newToken('punctuator',read());}lexState='value';},beforePropertyName:function beforePropertyName(){switch(c){case'$':case'_':buffer=read();lexState='identifierName';return;case'\\':read();lexState='identifierNameStartEscape';return;case'}':return newToken('punctuator',read());case'"':case'\'':doubleQuote=read()==='"';lexState='string';return;}if(util$1.isIdStartChar(c)){buffer+=read();lexState='identifierName';return}throw invalidChar(read())},afterPropertyName:function afterPropertyName(){if(c===':'){return newToken('punctuator',read())}throw invalidChar(read())},beforePropertyValue:function beforePropertyValue(){lexState='value';},afterPropertyValue:function afterPropertyValue(){switch(c){case',':case'}':return newToken('punctuator',read());}throw invalidChar(read())},beforeArrayValue:function beforeArrayValue(){if(c===']'){return newToken('punctuator',read())}lexState='value';},afterArrayValue:function afterArrayValue(){switch(c){case',':case']':return newToken('punctuator',read());}throw invalidChar(read())},end:function end(){throw invalidChar(read())}};function newToken(type,value){return {type:type,value:value,line:line,column:column}}function literal(s){var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=s[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var _c=_step.value;var p=peek();if(p!==_c){throw invalidChar(read())}read();}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError}}}}function escape(){var c=peek();switch(c){case'b':read();return '\b';case'f':read();return '\f';case'n':read();return '\n';case'r':read();return '\r';case't':read();return '\t';case'v':read();return '\x0B';case'0':read();if(util$1.isDigit(peek())){throw invalidChar(read())}return '\0';case'x':read();return hexEscape();case'u':read();return unicodeEscape();case'\n':case'\u2028':case'\u2029':read();return '';case'\r':read();if(peek()==='\n'){read();}return '';case'1':case'2':case'3':case'4':case'5':case'6':case'7':case'8':case'9':throw invalidChar(read());case undefined:throw invalidChar(read());}return read()}function hexEscape(){var buffer='';var c=peek();if(!util$1.isHexDigit(c)){throw invalidChar(read())}buffer+=read();c=peek();if(!util$1.isHexDigit(c)){throw invalidChar(read())}buffer+=read();return String.fromCodePoint(parseInt(buffer,16))}function unicodeEscape(){var buffer='';var count=4;while(count-->0){var _c2=peek();if(!util$1.isHexDigit(_c2)){throw invalidChar(read())}buffer+=read();}return String.fromCodePoint(parseInt(buffer,16))}var parseStates={start:function start(){if(token.type==='eof'){throw invalidEOF()}push();},beforePropertyName:function beforePropertyName(){switch(token.type){case'identifier':case'string':key=token.value;parseState='afterPropertyName';return;case'punctuator':pop();return;case'eof':throw invalidEOF();}},afterPropertyName:function afterPropertyName(){if(token.type==='eof'){throw invalidEOF()}parseState='beforePropertyValue';},beforePropertyValue:function beforePropertyValue(){if(token.type==='eof'){throw invalidEOF()}push();},beforeArrayValue:function beforeArrayValue(){if(token.type==='eof'){throw invalidEOF()}if(token.type==='punctuator'&&token.value===']'){pop();return}push();},afterPropertyValue:function afterPropertyValue(){if(token.type==='eof'){throw invalidEOF()}switch(token.value){case',':parseState='beforePropertyName';return;case'}':pop();}},afterArrayValue:function afterArrayValue(){if(token.type==='eof'){throw invalidEOF()}switch(token.value){case',':parseState='beforeArrayValue';return;case']':pop();}},end:function end(){}};function push(){var value=void 0;switch(token.type){case'punctuator':switch(token.value){case'{':value={};break;case'[':value=[];break;}break;case'null':case'boolean':case'numeric':case'string':value=token.value;break;}if(root===undefined){root=value;}else {var parent=stack[stack.length-1];if(Array.isArray(parent)){parent.push(value);}else {parent[key]=value;}}if(value!==null&&(typeof value==='undefined'?'undefined':_typeof(value))==='object'){stack.push(value);if(Array.isArray(value)){parseState='beforeArrayValue';}else {parseState='beforePropertyName';}}else {var current=stack[stack.length-1];if(current==null){parseState='end';}else if(Array.isArray(current)){parseState='afterArrayValue';}else {parseState='afterPropertyValue';}}}function pop(){stack.pop();var current=stack[stack.length-1];if(current==null){parseState='end';}else if(Array.isArray(current)){parseState='afterArrayValue';}else {parseState='afterPropertyValue';}}function invalidChar(c){if(c===undefined){return syntaxError('JSON5: invalid end of input at '+line+':'+column)}return syntaxError('JSON5: invalid character \''+formatChar(c)+'\' at '+line+':'+column)}function invalidEOF(){return syntaxError('JSON5: invalid end of input at '+line+':'+column)}function invalidIdentifier(){column-=5;return syntaxError('JSON5: invalid identifier character at '+line+':'+column)}function separatorChar(c){console.warn('JSON5: \''+c+'\' is not valid ECMAScript; consider escaping');}function formatChar(c){var replacements={'\'':'\\\'','"':'\\"','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t','\x0B':'\\v','\0':'\\0','\u2028':'\\u2028','\u2029':'\\u2029'};if(replacements[c]){return replacements[c]}if(c<' '){var hexString=c.charCodeAt(0).toString(16);return '\\x'+('00'+hexString).substring(hexString.length)}return c}function syntaxError(message){var err=new SyntaxError(message);err.lineNumber=line;err.columnNumber=column;return err}module.exports=exports['default'];
});

var stringify_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,'__esModule',{value:true});var _typeof=typeof Symbol==='function'&&typeof Symbol.iterator==='symbol'?function(obj){return typeof obj}:function(obj){return obj&&typeof Symbol==='function'&&obj.constructor===Symbol&&obj!==Symbol.prototype?'symbol':typeof obj};exports.default=stringify;var util$1=_interopRequireWildcard(util);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else {var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key];}}newObj.default=obj;return newObj}}function stringify(value,replacer,space){var stack=[];var indent='';var propertyList=void 0;var replacerFunc=void 0;var gap='';var quote=void 0;if(replacer!=null&&(typeof replacer==='undefined'?'undefined':_typeof(replacer))==='object'&&!Array.isArray(replacer)){space=replacer.space;quote=replacer.quote;replacer=replacer.replacer;}if(typeof replacer==='function'){replacerFunc=replacer;}else if(Array.isArray(replacer)){propertyList=[];var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=replacer[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var v=_step.value;var item=void 0;if(typeof v==='string'){item=v;}else if(typeof v==='number'||v instanceof String||v instanceof Number){item=String(v);}if(item!==undefined&&propertyList.indexOf(item)<0){propertyList.push(item);}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError}}}}if(space instanceof Number){space=Number(space);}else if(space instanceof String){space=String(space);}if(typeof space==='number'){if(space>0){space=Math.min(10,Math.floor(space));gap='          '.substr(0,space);}}else if(typeof space==='string'){gap=space.substr(0,10);}return serializeProperty('',{'':value});function serializeProperty(key,holder){var value=holder[key];if(value!=null){if(typeof value.toJSON5==='function'){value=value.toJSON5(key);}else if(typeof value.toJSON==='function'){value=value.toJSON(key);}}if(replacerFunc){value=replacerFunc.call(holder,key,value);}if(value instanceof Number){value=Number(value);}else if(value instanceof String){value=String(value);}else if(value instanceof Boolean){value=value.valueOf();}switch(value){case null:return 'null';case true:return 'true';case false:return 'false';}if(typeof value==='string'){return quoteString(value)}if(typeof value==='number'){return String(value)}if((typeof value==='undefined'?'undefined':_typeof(value))==='object'){return Array.isArray(value)?serializeArray(value):serializeObject(value)}return undefined}function quoteString(value){var quotes={'\'':0.1,'"':0.2};var replacements={'\'':'\\\'','"':'\\"','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t','\x0B':'\\v','\0':'\\0','\u2028':'\\u2028','\u2029':'\\u2029'};var product='';var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=value[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var c=_step2.value;switch(c){case'\'':case'"':quotes[c]++;product+=c;continue;}if(replacements[c]){product+=replacements[c];continue}if(c<' '){var hexString=c.charCodeAt(0).toString(16);product+='\\x'+('00'+hexString).substring(hexString.length);continue}product+=c;}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2}}}var quoteChar=quote||Object.keys(quotes).reduce(function(a,b){return quotes[a]<quotes[b]?a:b});product=product.replace(new RegExp(quoteChar,'g'),replacements[quoteChar]);return quoteChar+product+quoteChar}function serializeObject(value){if(stack.indexOf(value)>=0){throw TypeError('Converting circular structure to JSON5')}stack.push(value);var stepback=indent;indent=indent+gap;var keys=propertyList||Object.keys(value);var partial=[];var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=keys[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3=(_step3=_iterator3.next()).done);_iteratorNormalCompletion3=true){var key=_step3.value;var propertyString=serializeProperty(key,value);if(propertyString!==undefined){var member=serializeKey(key)+':';if(gap!==''){member+=' ';}member+=propertyString;partial.push(member);}}}catch(err){_didIteratorError3=true;_iteratorError3=err;}finally{try{if(!_iteratorNormalCompletion3&&_iterator3.return){_iterator3.return();}}finally{if(_didIteratorError3){throw _iteratorError3}}}var final=void 0;if(partial.length===0){final='{}';}else {var properties=void 0;if(gap===''){properties=partial.join(',');final='{'+properties+'}';}else {var separator=',\n'+indent;properties=partial.join(separator);final='{\n'+indent+properties+',\n'+stepback+'}';}}stack.pop();indent=stepback;return final}function serializeKey(key){if(key.length===0){return quoteString(key)}var firstChar=String.fromCodePoint(key.codePointAt(0));if(!util$1.isIdStartChar(firstChar)){return quoteString(key)}for(var i=firstChar.length;i<key.length;i++){if(!util$1.isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))){return quoteString(key)}}return key}function serializeArray(value){if(stack.indexOf(value)>=0){throw TypeError('Converting circular structure to JSON5')}stack.push(value);var stepback=indent;indent=indent+gap;var partial=[];for(var i=0;i<value.length;i++){var propertyString=serializeProperty(String(i),value);partial.push(propertyString!==undefined?propertyString:'null');}var final=void 0;if(partial.length===0){final='[]';}else {if(gap===''){var properties=partial.join(',');final='['+properties+']';}else {var separator=',\n'+indent;var _properties=partial.join(separator);final='[\n'+indent+_properties+',\n'+stepback+']';}}stack.pop();indent=stepback;return final}}module.exports=exports['default'];
});

var lib = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,'__esModule',{value:true});var _parse2=_interopRequireDefault(parse_1);var _stringify2=_interopRequireDefault(stringify_1);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}exports.default={parse:_parse2.default,stringify:_stringify2.default};module.exports=exports['default'];
});

var stripBom = x => {
	if (typeof x !== 'string') {
		throw new TypeError('Expected a string, got ' + typeof x);
	}

	// Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
	// conversion translates it to FEFF (UTF-16 BOM)
	if (x.charCodeAt(0) === 0xFEFF) {
		return x.slice(1);
	}

	return x;
};

var tsconfigLoader = createCommonjsModule(function (module, exports) {
var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });


// tslint:disable:no-require-imports


function tsConfigLoader(_a) {
    var getEnv = _a.getEnv, cwd = _a.cwd, _b = _a.loadSync, loadSync = _b === void 0 ? loadSyncDefault : _b;
    var TS_NODE_PROJECT = getEnv("TS_NODE_PROJECT");
    // tsconfig.loadSync handles if TS_NODE_PROJECT is a file or directory
    var loadResult = loadSync(cwd, TS_NODE_PROJECT);
    return loadResult;
}
exports.tsConfigLoader = tsConfigLoader;
function loadSyncDefault(cwd, filename) {
    // Tsconfig.loadSync uses path.resolve. This is why we can use an absolute path as filename
    var configPath = resolveConfigPath(cwd, filename);
    if (!configPath) {
        return {
            tsConfigPath: undefined,
            baseUrl: undefined,
            paths: undefined
        };
    }
    var config = loadTsconfig(configPath);
    return {
        tsConfigPath: configPath,
        baseUrl: config && config.compilerOptions && config.compilerOptions.baseUrl,
        paths: config && config.compilerOptions && config.compilerOptions.paths
    };
}
function resolveConfigPath(cwd, filename) {
    if (filename) {
        var absolutePath = fs.lstatSync(filename).isDirectory()
            ? path.resolve(filename, "./tsconfig.json")
            : path.resolve(cwd, filename);
        return absolutePath;
    }
    if (fs.statSync(cwd).isFile()) {
        return path.resolve(cwd);
    }
    var configAbsolutePath = walkForTsConfig(cwd);
    return configAbsolutePath ? path.resolve(configAbsolutePath) : undefined;
}
function walkForTsConfig(directory, existsSync) {
    if (existsSync === void 0) { existsSync = fs.existsSync; }
    var configPath = path.join(directory, "./tsconfig.json");
    if (existsSync(configPath)) {
        return configPath;
    }
    var parentDirectory = path.join(directory, "../");
    // If we reached the top
    if (directory === parentDirectory) {
        return undefined;
    }
    return walkForTsConfig(parentDirectory, existsSync);
}
exports.walkForTsConfig = walkForTsConfig;
function loadTsconfig(configFilePath, existsSync, readFileSync) {
    if (existsSync === void 0) { existsSync = fs.existsSync; }
    if (readFileSync === void 0) { readFileSync = function (filename) {
        return fs.readFileSync(filename, "utf8");
    }; }
    if (!existsSync(configFilePath)) {
        return undefined;
    }
    var configString = readFileSync(configFilePath);
    var cleanedJson = stripBom(configString);
    var config = lib.parse(cleanedJson);
    var extendedConfig = config.extends;
    if (extendedConfig) {
        if (typeof extendedConfig === "string" &&
            extendedConfig.indexOf(".json") === -1) {
            extendedConfig += ".json";
        }
        var currentDir = path.dirname(configFilePath);
        var base = loadTsconfig(path.join(currentDir, extendedConfig), existsSync, readFileSync) || {};
        // baseUrl should be interpreted as relative to the base tsconfig,
        // but we need to update it so it is relative to the original tsconfig being loaded
        if (base && base.compilerOptions && base.compilerOptions.baseUrl) {
            var extendsDir = path.dirname(extendedConfig);
            base.compilerOptions.baseUrl = path.join(extendsDir, base.compilerOptions.baseUrl);
        }
        return __assign({}, base, config, { compilerOptions: __assign({}, base.compilerOptions, config.compilerOptions) });
    }
    return config;
}
exports.loadTsconfig = loadTsconfig;
});

var minimist = function (args, opts) {
    if (!opts) opts = {};
    
    var flags = { bools : {}, strings : {}, unknownFn: null };

    if (typeof opts['unknown'] === 'function') {
        flags.unknownFn = opts['unknown'];
    }

    if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
      flags.allBools = true;
    } else {
      [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
          flags.bools[key] = true;
      });
    }
    
    var aliases = {};
    Object.keys(opts.alias || {}).forEach(function (key) {
        aliases[key] = [].concat(opts.alias[key]);
        aliases[key].forEach(function (x) {
            aliases[x] = [key].concat(aliases[key].filter(function (y) {
                return x !== y;
            }));
        });
    });

    [].concat(opts.string).filter(Boolean).forEach(function (key) {
        flags.strings[key] = true;
        if (aliases[key]) {
            flags.strings[aliases[key]] = true;
        }
     });

    var defaults = opts['default'] || {};
    
    var argv = { _ : [] };
    Object.keys(flags.bools).forEach(function (key) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    });
    
    var notFlags = [];

    if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--')+1);
        args = args.slice(0, args.indexOf('--'));
    }

    function argDefined(key, arg) {
        return (flags.allBools && /^--[^=]+$/.test(arg)) ||
            flags.strings[key] || flags.bools[key] || aliases[key];
    }

    function setArg (key, val, arg) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg) === false) return;
        }

        var value = !flags.strings[key] && isNumber(val)
            ? Number(val) : val
        ;
        setKey(argv, key.split('.'), value);
        
        (aliases[key] || []).forEach(function (x) {
            setKey(argv, x.split('.'), value);
        });
    }

    function setKey (obj, keys, value) {
        var o = obj;
        for (var i = 0; i < keys.length-1; i++) {
            var key = keys[i];
            if (key === '__proto__') return;
            if (o[key] === undefined) o[key] = {};
            if (o[key] === Object.prototype || o[key] === Number.prototype
                || o[key] === String.prototype) o[key] = {};
            if (o[key] === Array.prototype) o[key] = [];
            o = o[key];
        }

        var key = keys[keys.length - 1];
        if (key === '__proto__') return;
        if (o === Object.prototype || o === Number.prototype
            || o === String.prototype) o = {};
        if (o === Array.prototype) o = [];
        if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
            o[key] = value;
        }
        else if (Array.isArray(o[key])) {
            o[key].push(value);
        }
        else {
            o[key] = [ o[key], value ];
        }
    }
    
    function aliasIsBoolean(key) {
      return aliases[key].some(function (x) {
          return flags.bools[x];
      });
    }

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if (/^--.+=/.test(arg)) {
            // Using [\s\S] instead of . because js doesn't support the
            // 'dotall' regex modifier. See:
            // http://stackoverflow.com/a/1068308/13216
            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
            var key = m[1];
            var value = m[2];
            if (flags.bools[key]) {
                value = value !== 'false';
            }
            setArg(key, value, arg);
        }
        else if (/^--no-.+/.test(arg)) {
            var key = arg.match(/^--no-(.+)/)[1];
            setArg(key, false, arg);
        }
        else if (/^--.+/.test(arg)) {
            var key = arg.match(/^--(.+)/)[1];
            var next = args[i + 1];
            if (next !== undefined && !/^-/.test(next)
            && !flags.bools[key]
            && !flags.allBools
            && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            }
            else if (/^(true|false)$/.test(next)) {
                setArg(key, next === 'true', arg);
                i++;
            }
            else {
                setArg(key, flags.strings[key] ? '' : true, arg);
            }
        }
        else if (/^-[^-]+/.test(arg)) {
            var letters = arg.slice(1,-1).split('');
            
            var broken = false;
            for (var j = 0; j < letters.length; j++) {
                var next = arg.slice(j+2);
                
                if (next === '-') {
                    setArg(letters[j], next, arg);
                    continue;
                }
                
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split('=')[1], arg);
                    broken = true;
                    break;
                }
                
                if (/[A-Za-z]/.test(letters[j])
                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                
                if (letters[j+1] && letters[j+1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j+2), arg);
                    broken = true;
                    break;
                }
                else {
                    setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                }
            }
            
            var key = arg.slice(-1)[0];
            if (!broken && key !== '-') {
                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                && !flags.bools[key]
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i+1], arg);
                    i++;
                }
                else if (args[i+1] && /^(true|false)$/.test(args[i+1])) {
                    setArg(key, args[i+1] === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
        }
        else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(
                    flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                );
            }
            if (opts.stopEarly) {
                argv._.push.apply(argv._, args.slice(i + 1));
                break;
            }
        }
    }
    
    Object.keys(defaults).forEach(function (key) {
        if (!hasKey(argv, key.split('.'))) {
            setKey(argv, key.split('.'), defaults[key]);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), defaults[key]);
            });
        }
    });
    
    if (opts['--']) {
        argv['--'] = new Array();
        notFlags.forEach(function(key) {
            argv['--'].push(key);
        });
    }
    else {
        notFlags.forEach(function(key) {
            argv._.push(key);
        });
    }

    return argv;
};

function hasKey (obj, keys) {
    var o = obj;
    keys.slice(0,-1).forEach(function (key) {
        o = (o[key] || {});
    });

    var key = keys[keys.length - 1];
    return key in o;
}

function isNumber (x) {
    if (typeof x === 'number') return true;
    if (/^0x[0-9a-f]+$/i.test(x)) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

var options = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });

var argv = minimist(process.argv.slice(2), {
    string: ["project"],
    alias: {
        project: ["P"]
    }
});
var project = argv && argv.project;
exports.options = {
    cwd: project || process.cwd()
};
});

var configLoader_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });



function loadConfig(cwd) {
    if (cwd === void 0) { cwd = options.options.cwd; }
    return configLoader({ cwd: cwd });
}
exports.loadConfig = loadConfig;
function configLoader(_a) {
    var cwd = _a.cwd, explicitParams = _a.explicitParams, _b = _a.tsConfigLoader, tsConfigLoader = _b === void 0 ? tsconfigLoader.tsConfigLoader : _b;
    if (explicitParams) {
        // tslint:disable-next-line:no-shadowed-variable
        var absoluteBaseUrl_1 = path.isAbsolute(explicitParams.baseUrl)
            ? explicitParams.baseUrl
            : path.join(cwd, explicitParams.baseUrl);
        return {
            resultType: "success",
            configFileAbsolutePath: "",
            baseUrl: explicitParams.baseUrl,
            absoluteBaseUrl: absoluteBaseUrl_1,
            paths: explicitParams.paths,
            mainFields: explicitParams.mainFields,
            addMatchAll: explicitParams.addMatchAll
        };
    }
    // Load tsconfig and create path matching function
    var loadResult = tsConfigLoader({
        cwd: cwd,
        getEnv: function (key) { return process.env[key]; }
    });
    if (!loadResult.tsConfigPath) {
        return {
            resultType: "failed",
            message: "Couldn't find tsconfig.json"
        };
    }
    if (!loadResult.baseUrl) {
        return {
            resultType: "failed",
            message: "Missing baseUrl in compilerOptions"
        };
    }
    var tsConfigDir = path.dirname(loadResult.tsConfigPath);
    var absoluteBaseUrl = path.join(tsConfigDir, loadResult.baseUrl);
    return {
        resultType: "success",
        configFileAbsolutePath: loadResult.tsConfigPath,
        baseUrl: loadResult.baseUrl,
        absoluteBaseUrl: absoluteBaseUrl,
        paths: loadResult.paths || {}
    };
}
exports.configLoader = configLoader;
});

var register_1 = createCommonjsModule(function (module$1, exports) {
Object.defineProperty(exports, "__esModule", { value: true });



var noOp = function () { return void 0; };
function getCoreModules(builtinModules) {
    builtinModules = builtinModules || [
        "assert",
        "buffer",
        "child_process",
        "cluster",
        "crypto",
        "dgram",
        "dns",
        "domain",
        "events",
        "fs",
        "http",
        "https",
        "net",
        "os",
        "path",
        "punycode",
        "querystring",
        "readline",
        "stream",
        "string_decoder",
        "tls",
        "tty",
        "url",
        "util",
        "v8",
        "vm",
        "zlib"
    ];
    var coreModules = {};
    for (var _i = 0, builtinModules_1 = builtinModules; _i < builtinModules_1.length; _i++) {
        var module_1 = builtinModules_1[_i];
        coreModules[module_1] = true;
    }
    return coreModules;
}
/**
 * Installs a custom module load function that can adhere to paths in tsconfig.
 * Returns a function to undo paths registration.
 */
function register(explicitParams) {
    var configLoaderResult = configLoader_1.configLoader({
        cwd: options.options.cwd,
        explicitParams: explicitParams
    });
    if (configLoaderResult.resultType === "failed") {
        console.warn(configLoaderResult.message + ". tsconfig-paths will be skipped");
        return noOp;
    }
    var matchPath = matchPathSync.createMatchPath(configLoaderResult.absoluteBaseUrl, configLoaderResult.paths, configLoaderResult.mainFields, configLoaderResult.addMatchAll);
    // Patch node's module loading
    // tslint:disable-next-line:no-require-imports variable-name
    var Module = module;
    var originalResolveFilename = Module._resolveFilename;
    var coreModules = getCoreModules(Module.builtinModules);
    // tslint:disable-next-line:no-any
    Module._resolveFilename = function (request, _parent) {
        var isCoreModule = coreModules.hasOwnProperty(request);
        if (!isCoreModule) {
            var found = matchPath(request);
            if (found) {
                var modifiedArguments = [found].concat([].slice.call(arguments, 1)); // Passes all arguments. Even those that is not specified above.
                // tslint:disable-next-line:no-invalid-this
                return originalResolveFilename.apply(this, modifiedArguments);
            }
        }
        // tslint:disable-next-line:no-invalid-this
        return originalResolveFilename.apply(this, arguments);
    };
    return function () {
        // Return node's module loading to original state.
        Module._resolveFilename = originalResolveFilename;
    };
}
exports.register = register;
});

var lib$1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
// register is used from register.js in root dir

exports.createMatchPath = matchPathSync.createMatchPath;
exports.matchFromAbsolutePaths = matchPathSync.matchFromAbsolutePaths;

exports.createMatchPathAsync = matchPathAsync.createMatchPathAsync;
exports.matchFromAbsolutePathsAsync = matchPathAsync.matchFromAbsolutePathsAsync;

exports.register = register_1.register;

exports.loadConfig = configLoader_1.loadConfig;
});
