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

type PrivatePrice struct {
	UnitPrice float32 `json:"unitPrice"`
}

type GoodsInfos struct {
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
	}

	return s.returnError("Invalid Smart Contract function name.")
}

func (s *SmartContract) validate(po PO) bool {
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

func (s *SmartContract) writeChain(APIstub shim.ChaincodeStubInterface, po PO) error {
	// split unit price to private data first
	// then set unit price to 0
	var privatePrice PrivatePrice
	privatePrice.UnitPrice = po.GoodsInfos.UnitPrice
	po.GoodsInfos.UnitPrice = 0

	// write private data first
	privateBytes, err := json.Marshal(privatePrice)
	if err != nil {
		return err
	}
	logger.Debug("Write private data: " + string(privateBytes))
	err = APIstub.PutPrivateData("collectionDemo" ,po.PoNo, privateBytes)
	if err != nil {
		// if failed to write the private data (unit price), then just ignore
		logger.Error("Write private data failed: " + err.Error())
	}

	poAsBytes, err := json.Marshal(po)
	if err != nil {
		return err
	}
	logger.Debug("Write chain: " + string(poAsBytes))
	err = APIstub.PutState(po.PoNo, poAsBytes)
	if err != nil {
		return err
	}
	return nil
}

func (s *SmartContract) readChain(APIstub shim.ChaincodeStubInterface, poNo string) (*PO, error) {

	logger.Debug("Query on chain: " + poNo)
	result, err := APIstub.GetState(poNo)
	if err != nil {
		return nil, err
	}

	var po *PO
	err = json.Unmarshal(result, &po)
	if err != nil {
		return nil, err
	}

	logger.Debug("Query private data on chain: " + poNo)
	result, err = APIstub.GetPrivateData("collectionDemo", poNo)
	if err != nil {
		// if failed to get the private unit price, then just return PO with unit price 0
		logger.Error("Query private data on chain failed: " + err.Error())
		return po, nil
	}

	// if successfully got a private unit price, update PO
	var privatePrice PrivatePrice
	err = json.Unmarshal(result, &privatePrice)
	if err != nil {
		return nil, err
	}

	po.GoodsInfos.UnitPrice = privatePrice.UnitPrice

	return po, nil
}

func (s *SmartContract) uploadPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	logger.Debug("获取请求参数: " + args[0])

	poAsBytes := []byte(args[0])
	var po PO
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
	po, err := s.readChain(APIstub, poNo)
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
