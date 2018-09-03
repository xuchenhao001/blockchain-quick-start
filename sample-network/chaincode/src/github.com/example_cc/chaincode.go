package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// TransferChaincode Define chaincode
type TransferChaincode struct {
}

// Entry of chaincode
func main() {
	err := shim.Start(new(TransferChaincode))
	if err != nil {
		fmt.Printf("Error starting transfer chaincode: %s", err)
	}
}

//Init Initialize chaincode
func (t *TransferChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {

	return shim.Success(nil)
}

// Invoke invoke chaincode
func (t *TransferChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "put" {
		return t.addMoney(stub, args)
	} else if function == "get" {
		return t.queryMoney(stub, args)
	}
	return shim.Error("Unsupported operation. Please use add transfer query delete")
}

func (t *TransferChaincode) addMoney(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("Not enough arguments, Need 2: user,money")
	}
	username := args[0]
	value := []byte(args[1])
	var err error
	err = stub.PutState(username, value)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(value)

}

func (t *TransferChaincode) queryMoney(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Not enough arguments, Need 1: Username")
	}
	moneyAsBytes, err := stub.GetState(args[0])
	if err != nil || moneyAsBytes == nil {
		return shim.Error(err.Error())
	}

	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(moneyAsBytes)
}
