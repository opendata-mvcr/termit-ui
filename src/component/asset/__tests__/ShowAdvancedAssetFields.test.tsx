import * as React from "react";
import {shallow} from "enzyme";
import {ShowAdvancedAssetFields} from "../ShowAdvancedAssetFields";
import {intlFunctions} from "../../../__tests__/environment/IntlUtil";

describe("ShowAdvancedAssetFields", () => {

    it("is closed by default", () => {
        const wrapper = shallow(<ShowAdvancedAssetFields {...intlFunctions()}>
            <div>Test</div>
        </ShowAdvancedAssetFields>);
        expect(wrapper.find("Collapse").prop("isOpen")).toBeFalsy();
    });

    it("is open upon click", () => {
        const wrapper = shallow(<ShowAdvancedAssetFields {...intlFunctions()}>
            <div>Test</div>
        </ShowAdvancedAssetFields>);
        wrapper.find("#toggle-advanced").simulate("click");
        expect(wrapper.find("Collapse").prop("isOpen")).toBeTruthy();
    });

});