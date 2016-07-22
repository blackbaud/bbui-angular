/*jshint browser: true, jasmine: true */
/*global module, inject */

describe('core', function () {
    'use strict';

    var bbui;

    beforeEach(module(
        'bbui.core'
    ));

    beforeEach(inject(function (_bbui_) {
        bbui = _bbui_;
    }));

    describe('bbui', function () {

        describe("emptyGuid", function () {

            it("is the expected value", function () {
                expect(bbui.emptyGuid).toBe("00000000-0000-0000-0000-000000000000");
            });

        });

    });
});
