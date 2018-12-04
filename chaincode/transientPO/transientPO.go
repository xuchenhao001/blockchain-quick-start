// Written by Xu Chen Hao
package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hyperledger/fabric/bccsp"
	"github.com/hyperledger/fabric/bccsp/factory"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/chaincode/shim/ext/entities"
	sc "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

const DECKEY = "DECKEY"
const VERKEY = "VERKEY"
const ENCKEY = "ENCKEY"
const SIGKEY = "SIGKEY"
const IV = "IV"

var logger = shim.NewLogger("chaincode")

// Define the Smart Contract structure
type SmartContract struct {
	bccspInst bccsp.BCCSP
}

type R_Err struct {
	Reason string `json:"reason"`
}

type GoodsInfos struct {
	UnitPrice        string `json:"unitPrice"`
	Amount           string `json:"amount"`
	Quantity         string `json:"quantity"`
	DelDate          string `json:"delDate"`
	QuantityCode     string `json:"quantityCode"`
	GoodsModel       string `json:"goodsModel"`
	GoodNo           string `json:"goodNo"`
	PriceCode        string `json:"priceCode"`
	GoodsName        string `json:"goodsName"`
	GoodsDescription string `json:"goodsDescription"`
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
	TotalAmount   string     `json:"totalAmount"`
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
	tMap, err := APIstub.GetTransient()
	if err != nil {
		return shim.Error(fmt.Sprintf("Could not retrieve transient, err %s", err))
	}
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "uploadPOEncAll" {
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		}
		return s.uploadPO(APIstub, args, tMap[ENCKEY], tMap[IV], false, false)

	} else if function == "queryPODecAll" {
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		}
		return s.queryPO(APIstub, args, tMap[DECKEY], tMap[IV], false, false)

	} else if function == "uploadPOEncPart" {
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		}
		return s.uploadPO(APIstub, args, tMap[ENCKEY], tMap[IV], true, false)

	} else if function == "queryPODecPart" {
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		}
		return s.queryPO(APIstub, args, tMap[DECKEY], tMap[IV], true, false)
	} else if function == "uploadPOEncPartSign" {
		if _, in := tMap[ENCKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient encryption key %s", ENCKEY))
		} else if _, in := tMap[SIGKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient key %s", SIGKEY))
		}
		return s.uploadPO(APIstub, args, tMap[ENCKEY], tMap[SIGKEY], true, true)

	} else if function == "queryPODecPartVerify" {
		if _, in := tMap[DECKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient decryption key %s", DECKEY))
		} else if _, in := tMap[VERKEY]; !in {
			return shim.Error(fmt.Sprintf("Expected transient key %s", VERKEY))
		}
		return s.queryPO(APIstub, args, tMap[DECKEY], tMap[VERKEY], true, true)
	}

	return s.returnError("Invalid Smart Contract function name.")
}

func (s *SmartContract) validate(po PO) (bool, error) {
	unitPrice, err := strconv.ParseFloat(po.GoodsInfos.UnitPrice, 64)
	if err != nil {
		return false, err
	}

	if unitPrice <= 0 {
		return false, nil
	}

	quantity, err := strconv.ParseFloat(po.GoodsInfos.Quantity, 64)
	if err != nil {
		return false, err
	}

	if quantity <= 0 {
		return false, nil
	}

	amount, err := strconv.ParseFloat(po.GoodsInfos.Amount, 64)
	if err != nil {
		return false, err
	}

	if amount <= 0 {
		return false, nil
	}

	if unitPrice*quantity != amount {
		return false, nil
	}
	return true, nil
}

func (s *SmartContract) uploadPO(APIstub shim.ChaincodeStubInterface, args []string,
	encKey, signOrIV []byte, encPart, sign bool) sc.Response {

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
	validateResult, err := s.validate(po)
	if err != nil {
		return s.returnError("PO单合法性验证失败: " + err.Error())
	}
	if !validateResult {
		return s.returnError("PO单不合法")
	}

	// 数据上链
	if sign {
		err = s.writeChainSign(APIstub, po, encKey, signOrIV, encPart)
	} else {
		err = s.writeChain(APIstub, po, encKey, signOrIV, encPart)
	}
	if err != nil {
		return s.returnError("PO单上链失败: " + err.Error())
	}

	return shim.Success(poAsBytes)

}

func (s *SmartContract) queryPO(APIstub shim.ChaincodeStubInterface, args []string,
	decKey, signOrIV []byte, decPart, verify bool) sc.Response {

	if len(args) != 1 {
		return s.returnError("参数数量不正确")
	}

	poNo := args[0]

	if verify {
		po, err := s.readChainVerify(APIstub, poNo, decKey, signOrIV, decPart)
		if err != nil {
			return s.returnError("po单查询解密验证签名失败" + err.Error())
		}
		poAsBytes, err := json.Marshal(*po)
		if err != nil {
			return s.returnError(err.Error())
		}
		return shim.Success(poAsBytes)
	} else {
		po, err := s.readChain(APIstub, poNo, decKey, signOrIV, decPart)
		if err != nil {
			return s.returnError("po单查询解密失败" + err.Error())
		}
		poAsBytes, err := json.Marshal(*po)
		if err != nil {
			return s.returnError(err.Error())
		}
		return shim.Success(poAsBytes)
	}

}

// Do encrypt & write chain
func (s *SmartContract) writeChain(APIstub shim.ChaincodeStubInterface,
	po PO, encKey, IV []byte, encPart bool) error {

	ent, err := entities.NewAES256EncrypterEntity("ID", s.bccspInst, encKey, IV)
	if err != nil {
		return errors.New("entities.NewAES256EncrypterEntity failed, err %s" + err.Error())
	}

	if encPart == false {

		// Do fully encrypt
		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}
		logger.Debug("Do fully encrypt: " + string(poAsBytes))
		cipherText, err := s.encrypt(APIstub, ent, poAsBytes)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(cipherText))
		err = APIstub.PutState(po.PoNo, cipherText)
		if err != nil {
			return err
		}
	} else {

		// Do partly encrypt
		logger.Debug("Do partly encrypt: " + po.GoodsInfos.UnitPrice)
		cipherText, err := s.encrypt(APIstub, ent, []byte(po.GoodsInfos.UnitPrice))
		if err != nil {
			return err
		}

		po.GoodsInfos.UnitPrice = base64.StdEncoding.EncodeToString(cipherText)

		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(poAsBytes))
		err = APIstub.PutState(po.PoNo, poAsBytes)
		if err != nil {
			return err
		}
	}

	return nil
}

// Do read chain & decrypt
func (s *SmartContract) readChain(APIstub shim.ChaincodeStubInterface,
	poNo string, decKey, IV []byte, encPart bool) (*PO, error) {

	ent, err := entities.NewAES256EncrypterEntity("ID", s.bccspInst, decKey, IV)
	if err != nil {
		return nil, errors.New("entities.NewAES256EncrypterEntity failed, err %s" + err.Error())
	}

	var po PO

	logger.Debug("Query on chain: " + poNo)
	if encPart == false {

		// Do fully decrypt
		poAsBytes, err := APIstub.GetState(poNo)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do fully decrypt: " + string(poAsBytes))
		clearText, err := s.decrypt(APIstub, ent, poAsBytes)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(clearText, &po)
		if err != nil {
			return nil, err
		}

		return &po, nil

	} else {

		// Do partly decrypt
		poAsBytes, err := APIstub.GetState(poNo)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(poAsBytes, &po)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do partly decrypt: " + po.GoodsInfos.UnitPrice)
		cipherText, err := base64.StdEncoding.DecodeString(po.GoodsInfos.UnitPrice)
		if err != nil {
			return nil, err
		}
		unitPriceBytes, err := s.decrypt(APIstub, ent, cipherText)
		if err != nil {
			return nil, err
		}

		po.GoodsInfos.UnitPrice = string(unitPriceBytes)
	}

	return &po, nil
}

// Do encrypt & write chain
func (s *SmartContract) writeChainSign(APIstub shim.ChaincodeStubInterface,
	po PO, encKey, signKey []byte, encPart bool) error {

	ent, err := entities.NewAES256EncrypterECDSASignerEntity("ID", s.bccspInst, encKey, signKey)
	if err != nil {
		return errors.New("entities.NewAES256EncrypterEntity failed, err: " + err.Error())
	}

	if encPart == false {

		// Do fully encrypt
		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}
		logger.Debug("Do fully sign & encrypt: " + string(poAsBytes))
		cipherText, err := s.signEncrypt(APIstub, ent, poAsBytes)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(cipherText))
		err = APIstub.PutState(po.PoNo, cipherText)
		if err != nil {
			return err
		}
	} else {

		// Do partly encrypt
		logger.Debug("Do partly sign & encrypt: " + po.GoodsInfos.UnitPrice)
		cipherText, err := s.signEncrypt(APIstub, ent, []byte(po.GoodsInfos.UnitPrice))
		if err != nil {
			return err
		}

		po.GoodsInfos.UnitPrice = base64.StdEncoding.EncodeToString(cipherText)

		poAsBytes, err := json.Marshal(po)
		if err != nil {
			return err
		}

		logger.Debug("Write chain: " + string(poAsBytes))
		err = APIstub.PutState(po.PoNo, poAsBytes)
		if err != nil {
			return err
		}
	}

	return nil
}

// Do read chain & decrypt
func (s *SmartContract) readChainVerify(APIstub shim.ChaincodeStubInterface,
	poNo string, decKey, verKey []byte, encPart bool) (*PO, error) {

	ent, err := entities.NewAES256EncrypterECDSASignerEntity("ID", s.bccspInst, decKey, verKey)
	if err != nil {
		return nil, errors.New("entities.NewAES256EncrypterEntity failed, err: " + err.Error())
	}

	var po PO

	logger.Debug("Query on chain: " + poNo)
	if encPart == false {

		// Do fully decrypt
		poAsBytes, err := APIstub.GetState(poNo)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do fully decrypt & verify: " + string(poAsBytes))
		clearText, err := s.decryptVerify(APIstub, ent, poAsBytes)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(clearText, &po)
		if err != nil {
			return nil, err
		}

		return &po, nil

	} else {

		// Do partly decrypt
		poAsBytes, err := APIstub.GetState(poNo)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(poAsBytes, &po)
		if err != nil {
			return nil, err
		}

		logger.Debug("Do partly decrypt & verify: " + po.GoodsInfos.UnitPrice)
		cipherText, err := base64.StdEncoding.DecodeString(po.GoodsInfos.UnitPrice)
		if err != nil {
			return nil, err
		}
		unitPriceBytes, err := s.decryptVerify(APIstub, ent, cipherText)
		if err != nil {
			return nil, err
		}

		po.GoodsInfos.UnitPrice = string(unitPriceBytes)
	}

	return &po, nil
}

func (s *SmartContract) signEncrypt(stub shim.ChaincodeStubInterface,
	ent entities.EncrypterSignerEntity, value []byte) ([]byte, error) {

	logger.Debug("Sign and encrypt: " + string(value))
	msg := &entities.SignedMessage{Payload: value, ID: []byte(ent.ID())}
	err := msg.Sign(ent)
	if err != nil {
		return nil, err
	}

	// here we serialize the SignedMessage
	msgBytes, err := msg.ToBytes()
	if err != nil {
		return nil, err
	}

	logger.Debug("Sign and encrypt successfully: " + string(msgBytes))
	return s.encrypt(stub, ent, msgBytes)
}

func (s *SmartContract) decryptVerify(stub shim.ChaincodeStubInterface,
	ent entities.EncrypterSignerEntity, value []byte) ([]byte, error) {

	logger.Debug("Decrypt and verify: " + string(value))
	value, err := s.decrypt(stub, ent, value)
	if err != nil {
		return nil, err
	}

	msg := &entities.SignedMessage{}
	err = msg.FromBytes(value)
	if err != nil {
		return nil, err
	}

	// verify the signature
	ok, err := msg.Verify(ent)
	if err != nil {
		return nil, err
	} else if !ok {
		return nil, errors.New("invalid signature")
	}

	logger.Debug("Decrypt and verify successfully: " + string(msg.Payload))
	return msg.Payload, nil
}

func (s *SmartContract) encrypt(stub shim.ChaincodeStubInterface,
	ent entities.Encrypter, value []byte) ([]byte, error) {

	logger.Debug("Value to encrypt: " + string(value))
	cipherText, err := ent.Encrypt(value)
	if err != nil {
		return nil, errors.New("Encrypt failed: " + err.Error())
	}

	logger.Debug("After encrypt: " + string(cipherText))
	return cipherText, nil
}

func (s *SmartContract) decrypt(stub shim.ChaincodeStubInterface,
	ent entities.Encrypter, value []byte) ([]byte, error) {

	logger.Debug("Value to decrypt: " + string(value))
	clearText, err := ent.Decrypt(value)
	if err != nil {
		return nil, errors.New("Decrypt failed: " + err.Error())
	}

	logger.Debug("After decrypt: " + string(clearText))
	return clearText, nil
}

func main() {
	factory.InitFactories(nil)

	// Create a new Smart Contract
	err := shim.Start(&SmartContract{factory.GetDefault()})
	if err != nil {
		logger.Error("Error creating new Smart Contract: %s", err)
	}
}
