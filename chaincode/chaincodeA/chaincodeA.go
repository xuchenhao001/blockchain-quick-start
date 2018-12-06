// Written by Xu Chen Hao
package main

import (
	"bytes"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
	"time"
)

var logger = shim.NewLogger("chaincode")

// Define the Smart Contract structure
type SmartContract struct {
}

type R_Err struct {
	Reason string `json:"reason"`
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
	} else if function == "queryPOHistory" {
		return s.queryPOHistory(APIstub, args)
	} else if function == "richQueryPO" {
		return s.richQueryPO(APIstub, args)
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

	po := args[0]
	logger.Debug("Query on chain: " + po)
	result, err := APIstub.GetState(po)
	if err != nil {
		return s.returnError("po单查询失败" + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) queryPOHistory(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	po := args[0]
	logger.Debug("Query on chain: " + po)
	result, err := s.queryHistoryAsset(APIstub, po)
	if err != nil {
		return s.returnError("po单查询失败" + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) richQueryPO(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	queryString := args[0]
	logger.Debug("Rich query on chain: " + queryString)
	result, err := s.richQuery(APIstub, queryString)
	if err != nil {
		return s.returnError("Rich query failed: " + err.Error())
	}
	return shim.Success(result)
}

func (s *SmartContract) queryHistoryAsset(stub shim.ChaincodeStubInterface, key string) ([]byte, error) {
	resultsIterator, err := stub.GetHistoryForKey(key)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	logger.Debug("- getHistory returning:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}

func (s *SmartContract) richQuery(stub shim.ChaincodeStubInterface, queryString string)([] byte, error) {

	logger.Debug("Get rich query request: \n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	defer resultsIterator.Close()
	if err != nil {
		return nil, err
	}

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")
	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse,
			err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")
		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	logger.Debug("Rich query result: \n%s\n", buffer.String())
	return buffer.Bytes(), nil
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		logger.Error("Error creating new Smart Contract: %s", err)
	}
}
