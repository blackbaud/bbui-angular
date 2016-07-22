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

        describe("is", function () {

            it("returns false for expected values", function () {
                expect(bbui.is(null)).toBe(false);
                expect(bbui.is()).toBe(false);
                expect(bbui.is(undefined)).toBe(false);
            });

            it("returns true for expected values", function () {
                expect(bbui.is(false)).toBe(true);
                expect(bbui.is("")).toBe(true);
                expect(bbui.is({})).toBe(true);
            });

        });

        describe("findByProp", function () {

            it("does not fail when missing arguments", function () {
                expect(bbui.findByProp()).toBe(null);
            });

            it("finds the property", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "beetle")).toBe(items[1]);

            });

            it("does not error when the property does not exist", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "id", "beetle")).toBe(null);

            });

            it("does not error when the item is not found", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "dog")).toBe(null);

            });

            it("property is case sensitive", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "Name", "beetle")).toBe(null);

            });

            it("value is case sensitive", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "Beetle")).toBe(null);

            });

            it("property case sensitivity can be ignored", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "Name", "beetle", true)).toBe(items[1]);

            });

            it("value case sensitivity can be ignored", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "Beetle", false, true)).toBe(items[1]);

            });

        });

        describe("getPropValue", function () {

            it("gets the property value", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "name")).toBe("beetle");

            });

            it("returns null when the property is not found", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "id")).not.toBeDefined();

            });

            it("returns default when the property is not found", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "id", false, "1")).toBe("1");

            });

            it("is case sensitive", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "Name")).not.toBeDefined();

            });

            it("ignores case sensitivity when set", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "Name", true)).toBe("beetle");

            });

        });

        describe("clone", function () {

            it("returns a clone", function () {

                var item,
                    result;

                item = {
                    name: "Paul McCartney",
                    type: "Beatle",
                    wives: [
                        {
                            name: "Nancy Shevell"
                        },
                        {
                            name: "Heather Mills"
                        },
                        {
                            name: "Linda McCartney"
                        }
                    ]
                };

                result = bbui.clone(item);

                expect(result).not.toBe(item);
                expect(JSON.stringify(result)).toBe(JSON.stringify(item));

            });

            it("does not error on undefined", function () {
                expect(bbui.clone()).not.toBeDefined();
            });

            it("does not error on null", function () {
                expect(bbui.clone(null)).toBe(null);
            });

        });

        describe("copyProps", function () {

            it("copies properties", function () {

                var to = {
                        name: "aardvark",
                        type: "mammal"
                    },
                    from = {
                        name: "beetle",
                        id: "1"
                    };

                bbui.copyProps(to, from);

                expect(to.name).toBe("beetle");
                expect(to.id).toBe("1");
                expect(to.type).toBe("mammal");

            });

        });

    });
});
