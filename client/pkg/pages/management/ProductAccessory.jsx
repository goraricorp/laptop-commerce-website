import AccessoryForm from "../../components/modal/form/AccessoryForm"

export default function ProductAccessory() {
    const obj = {
        tower: '1111',
        street: '2222',
        district: '3333',
        city: '44444',
        state: '555555',
        country: '666666'
    }
    return (
        <>
            <div>Mai Phuong</div>
            <AccessoryForm
                address={obj}
                onHide={() => true}
                show={false}
            />
        </>
    )
}