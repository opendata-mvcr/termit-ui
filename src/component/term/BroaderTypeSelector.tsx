import * as React from "react";
import {useI18n} from "../hook/useI18n";
import {FormGroup, FormText, Input, Label, Modal, ModalBody, ModalHeader} from "reactstrap";
import {TERM_BROADER_SUBPROPERTIES} from "../../model/Term";

interface BroaderTypeSelectorProps {
    onSelect: (property: string) => void;
    onCancel: () => void;
    show: boolean;
}

const BroaderTypeSelector:React.FC<BroaderTypeSelectorProps> = ({onSelect, onCancel, show}) => {
    const {i18n} = useI18n();
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelect(e.target.name);
    }

    return <Modal id="broader-type-selector" isOpen={show} toggle={onCancel}>
        <ModalHeader toggle={onCancel}>{i18n("term.metadata.broader.selector.title")}</ModalHeader>
        <ModalBody>
            <FormGroup tag="fieldset">
                <FormGroup check={true}>
                    <Label check={true} className="attribute-label mb-0">
                        <Input type="radio" name="broader" className="mr-1" onChange={onChange}/>
                        {i18n("term.metadata.broader")}
                    </Label>
                    <FormText>{i18n("term.metadata.broader.hint")}</FormText>
                </FormGroup>
                {TERM_BROADER_SUBPROPERTIES.map(bsp => <FormGroup key={bsp.attribute} check={true} className="mt-2">
                    <Label check={true} className="attribute-label mb-0">
                    <Input type="radio" name={bsp.attribute} className="mr-1" onChange={onChange}/>
                    {i18n(bsp.selectorLabelKey)}
                </Label>
                    <FormText>{i18n(bsp.selectorHintKey)}</FormText>
                </FormGroup>)}
            </FormGroup>
        </ModalBody>
    </Modal>;
}

export default BroaderTypeSelector;