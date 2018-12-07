// Written by Xu Chen Hao
package main

import (
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("chaincode")

// Define the Smart Contract structure
type SmartContract struct {
}

type R_Err struct {
	Reason string `json:"reason"`
}

type GoodsInfos struct {
	Amount           float32 `json:"amount"`
	Quantity         float32 `json:"quantity"`
	DelDate          string  `json:"delDate"`
	QuantityCode     string  `json:"quantityCode"`
	GoodsModel       string  `json:"goodsModel"`
	GoodNo           string  `json:"goodNo"`
	PriceCode        string  `json:"priceCode"`
	GoodsName        string  `json:"goodsName"`
	GoodsDescription string  `json:"goodsDescription"`
}

type PO struct {
	Seller        string     `json:"seller"`
	Consignee     string     `json:"consignee"`
	Shipment      string     `json:"shipment"`
	Destination   string     `json:"destination"`
	InsureInfo    string     `json:"insureInfo"`
	TradeTerms    string     `json:"tradeTerms"`
	TotalCurrency string     `json:"totalCurrency"`
	Buyer         string     `json:"buyer"`
	TrafMode      string     `json:"trafMode"`
	GoodsInfos    GoodsInfos `json:"goodsInfos"`
	TotalAmount   float32    `json:"totalAmount"`
	Carrier       string     `json:"carrier"`
	PoNo          string     `json:"poNo"`
	Sender        string     `json:"sender"`
	PoDate        string     `json:"poDate"`
	TradeCountry  string     `json:"tradeCountry"`
}

type GoodsInfosPrivate struct {
	UnitPrice        float32 `json:"unitPrice"`
	Amount           float32 `json:"amount"`
	Quantity         float32 `json:"quantity"`
	DelDate          string  `json:"delDate"`
	QuantityCode     string  `json:"quantityCode"`
	GoodsModel       string  `json:"goodsModel"`
	GoodNo           string  `json:"goodNo"`
	PriceCode        string  `json:"priceCode"`
	GoodsName        string  `json:"goodsName"`
	GoodsDescription string  `json:"goodsDescription"`
}

type POPrivate struct {
	Seller        string            `json:"seller"`
	Consignee     string            `json:"consignee"`
	Shipment      string            `json:"shipment"`
	Destination   string            `json:"destination"`
	InsureInfo    string            `json:"insureInfo"`
	TradeTerms    string            `json:"tradeTerms"`
	TotalCurrency string            `json:"totalCurrency"`
	Buyer         string            `json:"buyer"`
	TrafMode      string            `json:"trafMode"`
	GoodsInfos    GoodsInfosPrivate `json:"goodsInfos"`
	TotalAmount   float32           `json:"totalAmount"`
	Carrier       string            `json:"carrier"`
	PoNo          string            `json:"poNo"`
	Sender        string            `json:"sender"`
	PoDate        string            `json:"poDate"`
	TradeCountry  string            `json:"tradeCountry"`
}

func (s *SmartContract) returnError(reason string) sc.Response {

	var re R_Err

	re.Reason = reason
	logger.Error(re.Reason)
	reAsBytes, _ := json.Marshal(re)

	return shim.Success(reAsBytes)
}

func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "uploadPO" {
		return s.uploadPO(APIstub, args)
	} else if function == "queryPO" {
		return s.queryPO(APIstub, args)
	} else if function == "queryPOPrivate" {
		return s.queryPOPrivate(APIstub, args)
	}

	return s.returnError("Invalid Smart Contract function name.")
}

func (s *SmartContract) priToPub(poPrivate POPrivate) PO {
	var po PO
	var goodsInfos GoodsInfos

	goodsInfos.Amount = poPrivate.GoodsInfos.Amount
	goodsInfos.Quantity = poPrivate.GoodsInfos.Quantity
	goodsInfos.DelDate = poPrivate.GoodsInfos.DelDate
	goodsInfos.QuantityCode = poPrivate.GoodsInfos.QuantityCode
	goodsInfos.GoodsModel = poPrivate.GoodsInfos.GoodsModel
	goodsInfos.GoodNo = poPrivate.GoodsInfos.GoodNo
	goodsInfos.PriceCode = poPrivate.GoodsInfos.PriceCode
	goodsInfos.GoodsName = poPrivate.GoodsInfos.GoodsName
	goodsInfos.GoodsDescription = poPrivate.GoodsInfos.GoodsDescription

	po.GoodsInfos = goodsInfos
	po.Seller = poPrivate.Seller
	po.Consignee = poPrivate.Consignee
	po.Shipment = poPrivate.Shipment
	po.Destination = poPrivate.Destination
	po.InsureInfo = poPrivate.InsureInfo
	po.TradeTerms = poPrivate.TradeTerms
	po.TotalCurrency = poPrivate.TotalCurrency
	po.Buyer = poPrivate.Buyer
	po.TrafMode = poPrivate.TrafMode
	po.TotalAmount = poPrivate.TotalAmount
	po.Carrier = poPrivate.Carrier
	po.PoNo = poPrivate.PoNo
	po.Sender = poPrivate.Sender
	po.PoDate = poPrivate.PoDate
	po.TradeCountry = poPrivate.TradeCountry

	return po
}

func (s *SmartContract) validate(po POPrivate) bool {
	if po.GoodsInfos.UnitPrice <= 0 {
		return false
	}
	if po.GoodsInfos.Quantity <= 0 {
		return false
	}
	if po.GoodsInfos.Amount <= 0 {
		return false
	}
	if po.GoodsInfos.UnitPrice*po.GoodsInfos.Quantity != po.GoodsInfos.Amount {
		return false
	}
	return true
}

func (s *SmartContract) writeChain(APIstub shim.ChaincodeStubInterface, po POPrivate) error {

	// write private data first
	privatePOBytes, err := json.Marshal(po)
	if err != nil {
		return err
	}
	logger.Debug("Write data on collectionPOPrivateDetails: " + string(privatePOBytes))
	err = APIstub.PutPrivateData("collectionPOPrivateDetails", po.PoNo, privatePOBytes)
	if err != nil {
		// if failed to write the private data (unit price), then just ignore
		logger.Error("Write private data failed: " + err.Error())
		return err
	}

	// then write public data
	publicPOBytes, err := json.Marshal(s.priToPub(po))
	if err != nil {
		logger.Error("Write public data failed: " + err.Error())
		return err
	}
	logger.Debug("Write data on collectionPO: " + string(publicPOBytes))
	err = APIstub.PutPrivateData("collectionPO", po.PoNo, publicPOBytes)
	if err != nil {
		return err
	}
	return nil
}

func (s *SmartContract) readPubChain(APIstub shim.ChaincodeStubInterface, poNo string) (*PO, error) {

	logger.Debug("Query collectionPO data: " + poNo)
	result, err := APIstub.GetPrivateData("collectionPO", poNo)
	if err != nil {
		return nil, err
	}

	var po *PO
	err = json.Unmarshal(result, &po)
	if err != nil {
		return nil, err
	}

	return po, nil
}

func (s *SmartContract) readPriChain(APIstub shim.ChaincodeStubInterface, poNo string) (*POPrivate, error) {

	logger.Debug("Query collectionPOPrivateDetails data: " + poNo)
	result, err := APIstub.GetPrivateData("collectionPOPrivateDetails", poNo)
	if err != nil {
		return nil, err
	}

	var poPrivate *POPrivate
	err = json.Unmarshal(result, &poPrivate)
	if err != nil {
		return nil, err
	}

	return poPrivate, nil
}

func (s *SmartContract) uploadPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	logger.Debug("获取请求参数: " + args[0])

	poAsBytes := []byte(args[0])
	var po POPrivate
	err := json.Unmarshal(poAsBytes, &po)
	if err != nil {
		return s.returnError("PO单格式错误: " + err.Error())
	}

	// 验证PO单是否合法
	if !s.validate(po) {
		return s.returnError("PO单不合法")
	}

	// 数据上链
	err = s.writeChain(APIstub, po)
	if err != nil {
		return s.returnError("PO单上链失败: " + err.Error())
	}

	return shim.Success(poAsBytes)

}

func (s *SmartContract) queryPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	poNo := args[0]
	po, err := s.readPubChain(APIstub, poNo)
	if err != nil {
		return s.returnError("po单查询失败: " + err.Error())
	}
	poAsByte, err := json.Marshal(po)
	if err != nil {
		return s.returnError("po单无效: " + err.Error())
	}
	return shim.Success(poAsByte)
}

func (s *SmartContract) queryPOPrivate(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	poNo := args[0]
	po, err := s.readPriChain(APIstub, poNo)
	if err != nil {
		return s.returnError("po单查询失败: " + err.Error())
	}
	poAsByte, err := json.Marshal(po)
	if err != nil {
		return s.returnError("po单无效: " + err.Error())
	}
	return shim.Success(poAsByte)
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		logger.Error("Error creating new Smart Contract: %s", err)
	}
}
