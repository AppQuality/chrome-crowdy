module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                expand: true,
                src: [
                    '**', /* Include everything */
                    '!**/*.txt', /* but exclude txt files */
                    '!package.json',
                    '!package-lock.json',
                    '!node_modules/**',
                    '!bin/**',
                ],
                dest: 'bin/crowdy',
            },
        },

        watch: {
            scripts: {
                files: [
                    '**', /* Include everything */
                    '!**/*.txt', /* but exclude txt files */
                    '!package.json',
                    '!package-lock.json',
                    '!GruntFile.js',
                    '!node_modules/**',
                    '!bin/**',
                ],
            tasks: ['copy'],
            options: {
                spawn: false,
            },
        },
    }
});

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['copy', 'watch']);

};