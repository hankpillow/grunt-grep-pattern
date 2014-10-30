/*
 * grunt-grep-pattern
 * https://github.com/hankpillow/grunt-grep-pattern
 , "only_folder" : {
			"all" : {
				inspect_dir : "sass/source/theme-common/core/config/colors/*.scss",
				inspect_file : "sass/source/theme-common/core/config/_colors.scss",
				match_pattern : /^[\s\$\w\-]+/mg,
				search_in : "sass"
			} ,
				inspect_dir : "sass/source/theme-common/core/config/colors/",
				match_pattern : /^[\s\$\w\-]+/mg
			}
			"only_file" : {
				inspect_file : "sass/source/theme-common/core/config/_colors.scss",
				match_pattern : /^[\s\$\w\-]+/mg,
				search_in : "sass"
			}
 */
module.exports = function(grunt) {
'use strict';
	grunt.initConfig({
		greppattern: {
			"folder" : {
				inspect_dir : "sass/source/theme-common/core/config/colors/*.scss",
				match_pattern : /^[\s\$\w\-]+/mg,
				search_in : "sass"
			}
		}
	});
	grunt.loadTasks('task');
};