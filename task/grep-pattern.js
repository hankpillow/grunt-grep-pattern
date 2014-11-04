/*
 * grunt-grep-pattern
 * https://github.com/hankpillow/grunt-grep-pattern
 */
module.exports = function(grunt) {
'use strict';

	var forEach = require("mout/array/forEach"),
			mixIn   = require("mout/object/mixIn"),
			map     = require("mout/array/map"),
			compact = require("mout/array/compact"),
			unique = require("mout/array/unique"),
			trim = require("mout/string/trim"),
			spawn   = require("child_process").spawn,
			StringDecoder = require('string_decoder').StringDecoder,
			decoder       = new StringDecoder("utf8");

	grunt.registerMultiTask('greppattern', 'simple grunt task to grep the results from a pattern into files.', function() {

		var	file_list = [],
			matches_to_inspect = [],
			report = [],
			VERBOSE_FILES = 1,
			VERBOSE_BOOLEAN = 2;

		var config = mixIn({
			verbose : VERBOSE_FILES,
			match_pattern : null,
			inspect_dir : null,
			inspect_file : null,
			search_in : "",
		},this.data);

		if (!config.match_pattern){
			grunt.fail.fatal("No pattern found. Please set 'match_pattern' property");
			return;
		}

		if (!config.inspect_dir && !config.inspect_file){
			grunt.fail.fatal("No file/folder do inspect. Please set 'inspect_dir' or 'inspect_file' property");
			return;
		}

		if (!!config.inspect_file) {
			if (grunt.file.exists(config.inspect_file)) {
				file_list.push(config.inspect_file);
			} else {
				grunt.fail.warn("Seems that '" + config.inspect_file + "'' is not there.");
			}
		}

		if (!!config.inspect_dir) {
			var now = file_list.length;
			forEach(grunt.file.expand(config.inspect_dir), function(value){
				file_list.push(value);
			});
			if (file_list.length === now) {
				grunt.fail.warn("Failed to expand and grab the files from: '"+ config.inspect_dir + "'");
			}
		}

		if(!file_list.length){
			grunt.fail.warn("Nothing to inspect!");
			return;
		}

		forEach(file_list, function (file) {
			var file_content = grunt.file.read(file);
			if (!!file_content && !!file_content.length) {
				var file_matches_list = file_content.match(config.match_pattern), new_value;
					file_matches_list = map(file_matches_list, function(value){
						new_value = value.replace(/[\n\t\s]+/,'');
						return !new_value.length ? null : trim(new_value);
					});
				file_matches_list = unique(compact(file_matches_list));
				if (file_matches_list.length){
					matches_to_inspect.push({
						file : file,
						matches : file_matches_list,
						matches_total : file_matches_list.length
					});
				}
			}
		});

		if (!matches_to_inspect || (!!matches_to_inspect && !matches_to_inspect.length)) {
			grunt.fail.warn("The pattern '" + config.match_pattern + "' didn't match any result");
			return;
		}

		function get_next_blob (blob_done) {
			if (!!blob_done){
				report.push(blob_done);
			}

			if (!matches_to_inspect.length){
				dump_report();
				return;
			}

			var blob = matches_to_inspect.pop();
				blob.matches_to_inspect = [].concat(blob.matches);
				blob.report = [];

			inspect_blob(blob);
		}

		// if you are here is because you have a bunch of files
		// and a list of blob to grep into this list.
		var done = this.async();
		get_next_blob();

		function inspect_blob (blob) {
			if (!!blob && !blob.matches_to_inspect.length) {
					//kill blob
					blob.matches_to_inspect = null;
					delete blob.matches_to_inspect;
					get_next_blob(blob);
					return;
				}
				grep_matches_in_files(blob, blob.matches_to_inspect.pop());
		}


		function grep_matches_in_files(blob, value) {
			var grep,
				log = {},
				args = ["-nre", value+"[\\: ]", config.search_in, "--exclude", blob.file ];
			try {
				grep = spawn("grep",args);
			} catch (err) {
				grunt.log.writeln(err);
				grunt.fail.fatal("Failed to grep '" + value + "' on: '" + config.search_in + "'");
				return;
			}

			log.value = value;
			log.total = 0;

			grep.stdout.on("data", function(data){
				if (!data) {
					grunt.fail.fatal("stdout:: failed to grep '" + value + "' on: '" + config.search_in + "'");
					return;
				}
				var result = decoder.write(data).split("\n") || [];
					result = map(result, function (value) {
						return (!!value && !value.length) ? null : value;
					});
					result = compact(result);
				log.entries = result;
				log.total = result.length||0;
			});

			grep.stderr.on("data", function (data) {
				grunt.log.writeln(data);
				grunt.fail.fatal("stderr:: failed to grep '" + value + "' on: '" + config.search_in + "'");
				return;
			});

			grep.on('close', function () {
				blob.report.push(log);
				inspect_blob(blob);
			});
		}

		function dump_report () {
				var all_failed = 0,
					all_files = report.length,
					matches_list = [],
					all_matches = 0;

				forEach(report, function (blob) {
					var passed = true,
						total = 0;

					matches_list = matches_list.concat(blob.matches);

					if (config.verbose === VERBOSE_FILES) {
						grunt.log.writeln("\n"+blob.file);
					}

					all_matches = all_matches + blob.matches_total;

					forEach(blob.report, function(log){
						if (log.total===0){
							total++;
							if (config.verbose === VERBOSE_FILES){
								grunt.log.writeln("- "+log.value);
							}
						}
						passed = passed && log.total>0;
					});

					if (passed){
						if (config.verbose === VERBOSE_FILES){
							grunt.log.writeln("✓ passed");
						}
					} else {
						all_failed = all_failed + total;
						if (config.verbose === VERBOSE_FILES){
							grunt.log.writeln("("+total+") entries never used.");
						}
					}
				});

				if (config.verbose === VERBOSE_BOOLEAN){
					grunt.log.write(all_failed === 0);
				} else {
					grunt.log.writeln("\n----");
					grunt.log.writeln("Total files: " + all_files);
					grunt.log.writeln(" - matches to grep (" + all_matches + ")");
					grunt.log.writeln("   "+matches_list.join(', '));
					grunt.log.writeln(" - unmatched values: "+ all_failed + " ("+Math.round(all_failed/all_matches*100)+"%)");
					grunt.log.writeln("----");
				}
				done();
			}
	});
};